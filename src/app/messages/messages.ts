import { Component, ChangeDetectorRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Kind, nip04 } from 'nostr-tools';
import { ApplicationState } from '../services/applicationstate';
import { QueueService } from '../services/queue.service';
import { RelayService } from '../services/relay';
@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MessagesComponent {
  @ViewChild('chatSidebar', { static: false }) chatSidebar!: MatSidenav;
  @ViewChild('userSidebar', { static: false }) userSidebar!: MatSidenav;

  constructor(private appState: ApplicationState, private queueService: QueueService, private relayService: RelayService) {}

  sidebarTitles = {
    user: '',
    chat: '',
  };

  open = {
    me: this,
    userSideBar: function (title: string = '') {
      this.me.userSidebar.open();
      this.me.sidebarTitles.user = title;
    },
    chatSideBar: function (title: string = '') {
      this.me.chatSidebar.open();
      this.me.userSidebar.close();
      this.me.sidebarTitles.chat = title;
    },
  };

  sub: any;

  ngOnDestroy() {
    this.relayService.unsubscribe(this.sub.id);
  }

  async ngOnInit() {
    this.appState.updateTitle('Messages');
    this.appState.goBack = true;
    this.appState.showBackButton = false;
    this.appState.actions = [];

    // this.relayService.subscribe([{  }])
    this.sub = this.relayService.subscribe([{ ['#p']: [this.appState.getPublicKey()], kinds: [Kind.EncryptedDirectMessage] }], 'messages');
  }
}
