import { Component, ChangeDetectorRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ApplicationState } from '../services/applicationstate';
import { UIService } from '../services/ui';
import { RelayService } from '../services/relay';
import { Kind } from 'nostr-tools';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent {
  @ViewChild('chatSidebar', { static: false }) chatSidebar!: MatSidenav;
  @ViewChild('userSidebar', { static: false }) userSidebar!: MatSidenav;
  subscription?: string;

  constructor(private appState: ApplicationState, private relayService: RelayService, public ui: UIService) {}
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
      debugger;
      this.me.chatSidebar.open();
      this.me.userSidebar.close();
      this.me.sidebarTitles.chat = title;
    },
  };

  async ngOnInit() {
    this.ui.clearChats();
    this.subscription = this.relayService.subscribe([{ kinds: [Kind.ChannelCreation, Kind.ChannelMetadata], limit: 10 }]).id;

    this.appState.updateTitle('Chat');
    this.appState.goBack = true;
    this.appState.actions = [];
  }

  ngOnDestroy() {
    // this.relayService.unsubscribe(this.subscription!);
    // this.ui.clearChats();
  }
}
