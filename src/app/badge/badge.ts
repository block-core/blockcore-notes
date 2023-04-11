import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { nip19 } from 'nostr-tools';
import { ApplicationState } from '../services/applicationstate';
import { BadgeService } from '../services/badge';
import { NavigationService } from '../services/navigation';
import { RelayService } from '../services/relay';
import { Utilities } from '../services/utilities';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-badge',
  templateUrl: 'badge.html',
  styleUrls: ['badge.css'],
})
export class BadgeComponent implements OnInit {
  showIssuing: boolean = false;
  sub: any;
  pubkeys: string = '';
  subscriptions: Subscription[] = [];

  constructor(
    private snackBar: MatSnackBar,
    private relayService: RelayService,
    public badgeService: BadgeService,
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public navigation: NavigationService,
    private utilities: Utilities
  ) {}

  ngOnDestroy() {
    this.relayService.unsubscribe(this.sub.id);
    this.utilities.unsubscribe(this.subscriptions);
  }

  edit(badge: any) {
    this.badgeService.selectedBadge = badge;
    this.router.navigateByUrl('/editor/badges');
  }

  async issueBadge(badge: any) {
    const pubkeys = this.pubkeys.split(/\r?\n/);
    const receivers: { pubkey: string; relay?: string }[] = [];

    for (let index = 0; index < pubkeys.length; index++) {
      const pubkey = pubkeys[index];
      if (pubkey.indexOf(',')) {
        const values = pubkey.split(',');
        receivers.push({ pubkey: values[0], relay: values[1] });
      } else {
        receivers.push({ pubkey });
      }
    }

    await this.navigation.issueBadge(badge.slug, receivers);

    this.showIssuing = false;
    this.pubkeys = '';

    this.snackBar.open('Badge has been issued', 'Hide', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  ngOnInit() {
    // if (this.navigation.currentEvent) {
    //   // If the event is already set, we'll use that directly and not load based upon ID.
    //   this.ui.setEvent(this.navigation.currentEvent);
    // }

    this.appState.updateTitle('Badge');
    this.appState.showBackButton = true;

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const id: string | null = params.get('id');

        if (!id) {
          this.router.navigateByUrl('/');
          return;
        }

        if (id.startsWith('naddr')) {
          const result = nip19.decode(id);
          console.log(result);

          if (result.type == 'naddr') {
            const data = result.data as nip19.AddressPointer;

            if (data.kind == 30009) {
              this.router.navigate(['/b', data.pubkey, data.identifier]);
              return;
            }
          }
        }

        const pubkey = id;
        const identifier = params.get('slug');

        if (!identifier) {
          return;
        }

        console.log('pubkey', pubkey);
        console.log('identifier', identifier);

        this.sub = this.relayService.download([{ kinds: [30009], authors: [pubkey], ['#d']: [identifier] }], undefined, 'Replaceable');
        //   this.queueService.enque(this.appState.getPublicKey(), 'BadgeDefinition');

        //   // Only trigger the event event ID if it's different than the navigation ID.
        //   if (this.navigation.currentEvent?.id != id) {
        //     debugger;
        //     // this.ui.setEventId(id);
        //     // this.thread.changeSelectedEvent(id);
        //   }
      })
    );
  }
}
