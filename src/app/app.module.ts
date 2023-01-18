import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MtxTooltipModule } from '@ng-matero/extensions/tooltip';
import { PhotoGalleryModule } from '@twogate/ngx-photo-gallery';

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
import { AuthGuardService } from './services/auth-guard';
import { ConnectComponent } from './connect/connect';
import { LogoutComponent } from './logout/logout';
import { HomeComponent } from './home/home';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { AgoPipe } from './shared/ago.pipe';
import { AboutComponent } from './about/about';
import { SettingsComponent } from './settings/settings';
import { ProfileComponent } from './profile/profile';
import { ProfileImageComponent } from './shared/profile-image/profile-image';
import { ProfileNameComponent } from './shared/profile-name/profile-name';
import { Bech32Pipe } from './shared/bech32.pipe';
import { DirectoryIconComponent } from './shared/directory-icon/directory-icon';
import { AppUpdateService } from './services/app-update';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserComponent } from './user/user';
import { CheckForUpdateService } from './services/check-for-update';
import { NoteDialog } from './shared/create-note-dialog/create-note-dialog';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { CirclesComponent } from './circles/circles';
import { PeopleComponent } from './people/people';
import { EventHeaderComponent } from './shared/event-header/event-header';
import { ProfileActionsComponent } from './shared/profile-actions/profile-actions';
import { CircleDialog } from './shared/create-circle-dialog/create-circle-dialog';
import { FollowDialog } from './shared/create-follow-dialog/create-follow-dialog';
import { FeedPrivateComponent } from './feed-private/feed-private';
import { FeedPublicComponent } from './feed-public/feed-public';
import { NotesComponent } from './notes/notes';
import { NgxColorsModule } from 'ngx-colors';
import { NoteComponent } from './note/note';
import { CircleStylePipe } from './shared/circle-style';
import { ReplyListComponent } from './shared/reply-list/reply-list';
import { ContentComponent } from './shared/content/content';
import { InfiniteScrollDirective } from './shared/scroll.directive';
import { ImportFollowDialog } from './circles/import-follow-dialog/import-follow-dialog';
import { ProfileHeaderComponent } from './shared/profile-header/profile-header';
import { AddRelayDialog } from './shared/add-relay-dialog/add-relay-dialog';
import { ProfileImageDialog } from './shared/profile-image-dialog/profile-image-dialog';
import { LicensesComponent } from './about/licenses/licenses';
import { HttpClientModule } from '@angular/common/http';
import { EventActionsComponent } from './shared/event-actions/event-actions';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ChatComponent } from './chat/chat';
import { FeedComponent } from './feed/feed';
import { WithStatusPipe } from './shared/loading.pipe';
import { EventThreadComponent } from './shared/event-thread/event-thread';
import { EventReactionsComponent } from './shared/event-reactions/event-reactions';
import { NgxLoadingButtonsModule } from 'ngx-loading-buttons';
import { ContentPhotosComponent } from './shared/content-photos/content-photos';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FollowingComponent } from './following/following';
import { FollowersComponent } from './followers/followers';
import { ProfileWidgetComponent } from './shared/profile-widget/profile-widget';
import { ImportSheet } from './shared/import-sheet/import-sheet';
import { EventButtonsComponent } from './shared/event-buttons/event-buttons';
import { ContentMusicComponent } from './shared/content-music/content-music';
import { MediaPlayerComponent } from './shared/media-player/media-player';
import { DateComponent } from './shared/date/date';
import { ContentPodcastComponent } from './shared/content-podcast/content-podcast';

@NgModule({
  declarations: [
    AppComponent,
    ProfileImageComponent,
    DirectoryIconComponent,
    ProfileNameComponent,
    ProfileComponent,
    ConnectComponent,
    LogoutComponent,
    HomeComponent,
    AgoPipe,
    Bech32Pipe,
    CircleStylePipe,
    WithStatusPipe,
    AboutComponent,
    FollowDialog,
    SettingsComponent,
    UserComponent,
    NoteDialog,
    CircleDialog,
    CirclesComponent,
    PeopleComponent,
    EventHeaderComponent,
    ProfileActionsComponent,
    FeedPrivateComponent,
    FeedPublicComponent,
    NotesComponent,
    NoteComponent,
    ReplyListComponent,
    ContentComponent,
    InfiniteScrollDirective,
    ImportFollowDialog,
    ProfileHeaderComponent,
    AddRelayDialog,
    ProfileImageDialog,
    LicensesComponent,
    EventActionsComponent,
    ChatComponent,
    FeedComponent,
    EventThreadComponent,
    EventReactionsComponent,
    ContentPhotosComponent,
    FollowingComponent,
    FollowersComponent,
    ProfileWidgetComponent,
    ImportSheet,
    EventButtonsComponent,
    ContentMusicComponent,
    MediaPlayerComponent,
    DateComponent,
    ContentPodcastComponent
  ],
  imports: [
    HttpClientModule,
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
    MtxTooltipModule,
    MatExpansionModule,
    MatTableModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    PickerModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    MatBottomSheetModule,
    NgxLoadingButtonsModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatDialogModule,
    MatDatepickerModule,
    PhotoGalleryModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    NgxMatTimepickerModule,
    NgxColorsModule,
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
