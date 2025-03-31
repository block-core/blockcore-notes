import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { NostrChannelDocument } from '../services/interfaces';
import { ChannelService } from '../services/channel';
import { MatDialog } from '@angular/material/dialog';
import { CreateChannelDialog } from '../shared/create-channel-dialog/create-channel-dialog';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-channels',
    templateUrl: './channels.html',
    styleUrls: ['./channels.css'],
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatListModule,
      MatProgressSpinnerModule
    ]
})
export class ChannelsComponent {
  channels = signal<NostrChannelDocument[]>([]);
  loading = signal<boolean>(true);
  
  constructor(
    private router: Router,
    private appState: ApplicationState,
    private channelService: ChannelService,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    this.appState.updateTitle('Channels');
    this.appState.showBackButton = false;
    this.appState.actions = [
      {
        icon: 'add',
        tooltip: 'Create Channel',
        click: () => {
          this.createChannel();
        },
      },
    ];
    
    try {
      const channelsList = await this.channelService.getChannels();
      this.channels.set(channelsList);
    } finally {
      this.loading.set(false);
    }
  }

  openChannel(channel: NostrChannelDocument) {
    this.router.navigate(['/channel', channel.id]);
  }

  createChannel(): void {
    const dialogRef = this.dialog.open(CreateChannelDialog, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        const newChannel = await this.channelService.createChannel(result);
        // Add new channel to list
        this.channels.update(channels => [...channels, newChannel]);
        // Navigate to the new channel
        this.router.navigate(['/channel', newChannel.id]);
      }
    });
  }

  trackByFn(index: number, item: NostrChannelDocument) {
    return item.id;
  }
}
