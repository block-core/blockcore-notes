import { Routes } from '@angular/router';
import { ConnectComponent } from './pages/connect/connect';
import { AboutComponent } from './pages/about/about';
import { HomeComponent } from './pages/home/home';
import { LogoutComponent } from './pages/logout/logout';
import { NotesComponent } from './pages/notes/notes';
import { ProfileComponent } from './pages/profile/profile';
import { AuthGuardService as AuthGuard } from './services/auth-guard';
import { SettingsComponent } from './pages/settings/settings';
import { UserComponent } from './pages/user/user';
import { CirclesComponent } from './pages/circles/circles';
import { PeopleComponent } from './pages/people/people';
import { NoteComponent } from './pages/note/note';
import { LicensesComponent } from './pages/about/licenses/licenses';
import { ChatComponent } from './pages/chat/chat';
import { FeedComponent } from './pages/feed/feed';
import { FollowingComponent } from './pages/following/following';
import { FollowersComponent } from './pages/followers/followers';
import { QueueComponent } from './pages/queue/queue';
import { MessagesComponent } from './pages/messages/messages';
import { MessageComponent } from './pages/message/message';
import { DevelopmentComponent } from './development/development';
import { LoadingResolverService } from './services/loading-resolver';
import { NotificationsComponent } from './pages/notifications/notifications';
import { FeedPrivateComponent } from './components/feed-private/feed-private';
import { ConnectKeyComponent } from './pages/connect/key/key';
import { EditorComponent } from './pages/editor/editor';
import { ArticleComponent } from './pages/article/article';
import { RelaysManagementComponent } from './pages/relays/relays';
import { BadgesComponent } from './pages/badges/badges';
import { LoginComponent } from './pages/connect/login/login';
import { CreateProfileComponent } from './pages/connect/create/create';
import { EditorBadgesComponent } from './pages/editor-badges/editor';
import { BadgeComponent } from './pages/badge/badge';
import { ExampleComponent } from './example/example';
import { ArticlesComponent } from './pages/articles/articles.component';
import { FilesComponent } from './pages/files/files.component';

export const routes: Routes = [
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
    path: 'files/:id',
    component: FilesComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'articles',
    component: ArticlesComponent,
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
    component: AboutComponent,
    canActivate: [AuthGuard],
    resolve: {
      data: LoadingResolverService,
    },
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
