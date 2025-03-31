import { Component, ChangeDetectorRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ApplicationState } from '../services/applicationstate';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { ChatListComponent } from '../shared/chat-list/chat-list.component';
import { UserListComponent } from '../shared/user-list/user-list.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { ChatDetailComponent } from '../shared/chat-detail/chat-detail.component';
import { UserProfileComponent } from '../shared/user-profile/user-profile.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, 
    ChatListComponent,
    UserListComponent,
    MatToolbarModule,
    MatIconModule,
    ChatDetailComponent,
    UserProfileComponent,
    MatSidenavModule, MatTabsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent {
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
    this.appState.updateTitle('Chat');
    this.appState.goBack = true;
    this.appState.actions = [];
  }
}
