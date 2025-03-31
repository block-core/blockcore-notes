import { Routes } from '@angular/router';
import { AuthGuard } from './shared/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./home/home').then(m => m.HomeComponent)
  },
  {
    path: 'connect',
    loadComponent: () => import('./connect/connect').then(m => m.ConnectComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./connect/create/create').then(m => m.CreateProfileComponent)
  },
  {
    path: 'feed',
    canActivate: [AuthGuard],
    loadComponent: () => import('./feed/feed').then(m => m.FeedComponent)
  },
  {
    path: 'feed/private',
    canActivate: [AuthGuard],
    loadComponent: () => import('./feed-private/feed-private').then(m => m.FeedPrivateComponent)
  },
  {
    path: 'feed/private/:circle',
    canActivate: [AuthGuard],
    loadComponent: () => import('./feed-private/feed-private').then(m => m.FeedPrivateComponent)
  },
  {
    path: 'feed/public',
    canActivate: [AuthGuard],
    loadComponent: () => import('./feed-public/feed-public').then(m => m.FeedPublicComponent)
  },
  {
    path: 'p/:id',
    canActivate: [AuthGuard],
    loadComponent: () => import('./user/user').then(m => m.UserComponent)
  },
  {
    path: 'e/:id',
    canActivate: [AuthGuard],
    loadComponent: () => import('./note/note').then(m => m.NoteComponent)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent)
  },
  {
    path: 'relays',
    canActivate: [AuthGuard],
    loadComponent: () => import('./relays/relays').then(m => m.RelaysManagementComponent)
  },
  {
    path: 'people',
    canActivate: [AuthGuard],
    loadComponent: () => import('./people/people').then(m => m.PeopleComponent)
  },
  {
    path: 'circles',
    canActivate: [AuthGuard],
    loadComponent: () => import('./circles/circles').then(m => m.CirclesComponent)
  },
  {
    path: 'queue',
    canActivate: [AuthGuard],
    loadComponent: () => import('./queue/queue').then(m => m.QueueComponent)
  },
  {
    path: 'development',
    canActivate: [AuthGuard],
    loadComponent: () => import('./development/development').then(m => m.DevelopmentComponent)
  },
  {
    path: 'channels',
    canActivate: [AuthGuard],
    loadComponent: () => import('./channels/channels').then(m => m.ChannelsComponent)
  },
  {
    path: 'channel/:id',
    canActivate: [AuthGuard],
    loadComponent: () => import('./channel/channel').then(m => m.ChannelComponent)
  },
  {
    path: 'inbox',
    canActivate: [AuthGuard],
    loadComponent: () => import('./inbox/inbox').then(m => m.InboxComponent)
  },
  {
    path: 'bookmarks',
    canActivate: [AuthGuard],
    loadComponent: () => import('./bookmarks/bookmarks').then(m => m.BookmarksComponent)
  },
  {
    path: 'editor',
    canActivate: [AuthGuard],
    loadComponent: () => import('./editor/editor').then(m => m.EditorComponent)
  },
  {
    path: 'example',
    loadComponent: () => import('./example/example').then(m => m.ExampleComponent)
  }
];
