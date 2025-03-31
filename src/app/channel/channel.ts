import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { NostrChannelDocument, NostrEventDocument } from '../services/interfaces';
import { ChannelService } from '../services/channel';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { EventComponent } from '../shared/event/event';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-channel',
    templateUrl: './channel.html',
    styleUrls: ['./channel.css'],
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatInputModule,
      FormsModule,
      EventComponent,
      MatProgressSpinnerModule
    ]
})
export class ChannelComponent {
  channel = signal<NostrChannelDocument | null>(null);
  messages = signal<NostrEventDocument[]>([]);
  loading = signal<boolean>(true);
  newMessage = signal<string>('');
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appState: ApplicationState,
    private channelService: ChannelService
  ) {}

  async ngOnInit() {
    this.appState.showBackButton = true;
    
    this.route.paramMap.subscribe(async (params) => {
      const channelId = params.get('id');
      if (!channelId) {
        this.router.navigate(['/channels']);
        return;
      }
      
      try {
        // Load channel details
        const channelDetails = await this.channelService.getChannel(channelId);
        this.channel.set(channelDetails);
        
        // Set title
        if (channelDetails) {
          this.appState.updateTitle(channelDetails.name || 'Channel');
        } else {
          this.appState.updateTitle('Channel');
        }
        
        // Load messages
        const channelMessages = await this.channelService.getChannelMessages(channelId);
        this.messages.set(channelMessages);
      } finally {
        this.loading.set(false);
      }
    });
  }

  async sendMessage() {
    const message = this.newMessage();
    if (!message.trim() || !this.channel()) return;
    
    await this.channelService.sendMessage(this.channel()!.id, message);
    this.newMessage.set('');
    
    // Refresh messages
    const channelMessages = await this.channelService.getChannelMessages(this.channel()!.id);
    this.messages.set(channelMessages);
  }

  trackByFn(index: number, item: NostrEventDocument) {
    return item.id;
  }

  ngOnDestroy() {
    // Unsubscribe from real-time updates if needed
  }
}
