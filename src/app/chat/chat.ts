import { Component, ChangeDetectorRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ApplicationState } from '../services/applicationstate';
import { ProfileService } from '../services/profile';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent {
  @ViewChild('chatSidebar', { static: false }) chatSidebar!: MatSidenav;
  @ViewChild('userSidebar', { static: false }) userSidebar!: MatSidenav;

  constructor(private appState: ApplicationState, public profileService: ProfileService) {}
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

  displayLabels = true;

  toggleChannelSize() {
    this.displayLabels = !this.displayLabels;

    // setTimeout(() => {
    //   this.options.values.hideSideLabels = !this.displayLabels;
    //   this.options.save();
    // }, 250);

    // this._container._ngZone.onMicrotaskEmpty.subscribe(() => {
    //   this._container._updateStyles();
    //   this._container._changeDetectorRef.markForCheck();
    // });
  }

  async ngOnInit() {
    this.appState.updateTitle('Channels');
    this.appState.goBack = true;
    this.appState.actions = [];
  }
}
