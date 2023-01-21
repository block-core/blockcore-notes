import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConnectComponent } from './connect/connect';
import { AboutComponent } from './about/about';
import { HomeComponent } from './home/home';
import { LogoutComponent } from './logout/logout';
import { NotesComponent } from './notes/notes';
import { ProfileComponent } from './profile/profile';
import { AuthGuardService as AuthGuard } from './services/auth-guard';
import { SettingsComponent } from './settings/settings';
import { UserComponent } from './user/user';
import { CirclesComponent } from './circles/circles';
import { PeopleComponent } from './people/people';
import { NoteComponent } from './note/note';
import { LicensesComponent } from './about/licenses/licenses';
import { ChatComponent } from './chat/chat';
import { FeedComponent } from './feed/feed';
import { FollowingComponent } from './following/following';
import { FollowersComponent } from './followers/followers';
import { QueueComponent } from './queue/queue';
import { MessagesComponent } from './messages/messages';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'connect',
    component: ConnectComponent,
  },
  {
    path: 'feed',
    component: FeedComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'notes',
    component: NotesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'circles',
    component: CirclesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'people',
    component: PeopleComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'messages',
    component: MessagesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'user/:id',
    component: UserComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'note/:id',
    component: NoteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'p/:id',
    component: UserComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'e/:id',
    component: NoteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'followers/:id',
    component: FollowersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'following/:id',
    component: FollowingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'about',
    component: AboutComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'about/licenses',
    component: LicensesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'queue',
    component: QueueComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
