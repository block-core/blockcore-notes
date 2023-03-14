import { Component, Input } from '@angular/core';
import { OptionsService } from 'src/app/services/options';
import { ThreadService } from 'src/app/services/thread';
import { Circle, NostrEventDocument, NostrProfileDocument, ThreadEntry } from '../../services/interfaces';
import { Subscription } from 'rxjs';
import { UIService } from 'src/app/services/ui';
import { ProfileService } from 'src/app/services/profile';
import { MatDialog } from '@angular/material/dialog';
import { ZappersListDialogComponent } from '../zappers-list-dialog/zappers-list-dialog.component';

@Component({
  selector: 'app-event-reactions',
  templateUrl: './event-reactions.html',
  styleUrls: ['./event-reactions.css'],
})
export class EventReactionsComponent {
  // @Input() threadEntry?: ThreadEntry | undefined;
  @Input() event?: NostrEventDocument | undefined;
  threadEntry?: ThreadEntry;

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;
  sub?: Subscription;
  amountZapped = 0;

  constructor(public thread: ThreadService, private profiles: ProfileService, public ui: UIService, public optionsService: OptionsService, public dialog: MatDialog) { }

  ngAfterViewInit() { }

  async ngOnInit() {
    if (!this.optionsService.values.enableReactions && !this.optionsService.values.enableZapping) {
      this.event = undefined;
      this.threadEntry = undefined;
      return;
    }

    this.sub = this.ui.reactions$.subscribe((id) => {
      if (!this.event) {
        return;
      }

      if (id == this.event.id) {
        this.threadEntry = this.thread.getTreeEntry(this.event.id!);
        this.amountZapped = this.threadEntry?.zaps?.reduce((sum: number, zap: any) => sum + zap.amount, 0) || 0;
      }
    });

    this.threadEntry = this.thread.getTreeEntry(this.event?.id!);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  openDialog() {
    const zaps = this.threadEntry?.zaps;
    this.dialog.open(ZappersListDialogComponent, {
      data: {
        zaps: zaps,
        event: this.event
      }
    });
  }

}
