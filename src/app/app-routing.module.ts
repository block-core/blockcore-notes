import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConnectComponent } from './connect/connect.component';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { LogoutComponent } from './logout/logout.component';
import { NotesComponent } from './notes/notes.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthGuardService as AuthGuard } from './services/auth-guard.service';
import { SettingsComponent } from './settings/settings.component';
import { UserComponent } from './user/user.component';
import { CirclesComponent } from './circles/circles.component';
import { PeopleComponent } from './people/people.component';
import { NoteComponent } from './note/note.component';

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
    path: 'about',
    component: AboutComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
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
