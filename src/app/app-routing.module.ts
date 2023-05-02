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
import { MessageComponent } from './message/message';
import { DevelopmentComponent } from './development/development';
import { LoadingResolverService } from './services/loading-resolver';
import { NotificationsComponent } from './notifications/notifications';
import { FeedPrivateComponent } from './feed-private/feed-private';
import { ConnectKeyComponent } from './connect/key/key';
import { EditorComponent } from './editor/editor';
import { ArticleComponent } from './article/article';
import { RelaysManagementComponent } from './relays/relays';
import { BadgesComponent } from './badges/badges';
import { LoginComponent } from './connect/login/login';
import { CreateProfileComponent } from './connect/create/create';
import { EditorBadgesComponent } from './editor-badges/editor';
import { BadgeComponent } from './badge/badge';
import { ExampleComponent } from './example/example';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'connect',
    component: ConnectComponent,
  },
  {
    path: 'connect/key',
    component: ConnectKeyComponent,
  },
  {
    path: 'connect/login',
    component: LoginComponent,
  },
  {
    path: 'connect/create',
    component: CreateProfileComponent,
  },
  {
    path: 'feed',
    component: FeedPrivateComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'feed/:circle',
    component: FeedPrivateComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'notes',
    component: NotesComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'circles',
    component: CirclesComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'people',
    component: PeopleComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'm',
    component: MessagesComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'm/:id',
    component: MessageComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'badges/:id',
    component: BadgesComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'user/:id',
    component: UserComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'editor',
    component: EditorComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'editor/badges',
    component: EditorBadgesComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'note/:id',
    component: NoteComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'p/:id',
    component: UserComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'b/:id',
    component: BadgeComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'b/:id/:slug',
    component: BadgeComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'e/:id',
    component: NoteComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'a/:id',
    component: ArticleComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'a/:id/:slug',
    component: ArticleComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'followers/:id',
    component: FollowersComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'following/:id',
    component: FollowingComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'about',
    loadChildren: () => import('./about/about.module').then((m) => m.AboutModule),
    // component: AboutComponent,
    // canActivate: [AuthGuard],
    // resolve: {
    //   data: LoadingResolverService,
    // },
  },
  {
    path: 'about/licenses',
    component: LicensesComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'relays',
    component: RelaysManagementComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'development',
    component: DevelopmentComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'example',
    component: ExampleComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'queue',
    component: QueueComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollOffset: [0, 0], scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
