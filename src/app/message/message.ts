import { Component, ChangeDetectorRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ApplicationState } from '../services/applicationstate';
@Component({
  selector: 'app-message',
  templateUrl: './message.html',
  styleUrls: ['./message.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MessageComponent {
  @ViewChild('chatSidebar', { static: false }) chatSidebar!: MatSidenav;
  @ViewChild('userSidebar', { static: false }) userSidebar!: MatSidenav;

  constructor(private appState: ApplicationState) {}

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

  async ngOnInit() {
    this.appState.updateTitle('@Milad');
    this.appState.goBack = true;
    this.appState.showBackButton = true;
    this.appState.actions = [];
  }
}
