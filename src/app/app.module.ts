import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTreeModule } from '@angular/material/tree';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AuthGuardService } from './services/auth-guard.service';
import { ConnectComponent } from './connect/connect.component';
import { LogoutComponent } from './logout/logout.component';
import { HomeComponent } from './home/home.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { AgoPipe } from './shared/ago.pipe';
import { AboutComponent } from './about/about.component';
import { SettingsComponent } from './settings/settings.component';
import { ProfileComponent } from './profile/profile.component';
import { IdentitiesComponent } from './identities/identities.component';
import { ProfileImageComponent } from './shared/profile-image/profile-image.component';
import { ProfileNameComponent } from './shared/profile-name/profile-name.component';
import { Bech32Pipe } from './shared/bech32.pipe';
import { DirectoryIconComponent } from './shared/directory-icon/directory-icon.component';
import { AppUpdateService } from './services/app-update.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserComponent } from './user/user.component';
import { CheckForUpdateService } from './services/check-for-update.service';
import { NoteDialog } from './shared/create-note-dialog/create-note-dialog';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { CirclesComponent } from './circles/circles.component';
import { PeopleComponent } from './people/people.component';
import { ProfileHeaderComponent } from './shared/profile-header/profile-header.component';
import { ProfileActionsComponent } from './shared/profile-actions/profile-actions.component';

@NgModule({
  declarations: [
    AppComponent,
    ProfileImageComponent,
    DirectoryIconComponent,
    ProfileNameComponent,
    IdentitiesComponent,
    ProfileComponent,
    ConnectComponent,
    LogoutComponent,
    HomeComponent,
    AgoPipe,
    Bech32Pipe,
    AboutComponent,
    SettingsComponent,
    UserComponent,
    NoteDialog,
    CirclesComponent,
    PeopleComponent,
    ProfileHeaderComponent,
    ProfileActionsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatCardModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatMenuModule,
    MatTreeModule,
    MatBadgeModule,
    MatTabsModule,
    MatTooltipModule,
    MatExpansionModule,
    MatTableModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    PickerModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatDialogModule,

    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [AuthGuardService, AppUpdateService, CheckForUpdateService],
  bootstrap: [AppComponent],
})
export class AppModule {}
