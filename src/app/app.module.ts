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
import { ImportFollowDialog } from './people/import-follow-dialog/import-follow-dialog';
import { ProfileHeaderComponent } from './shared/profile-header/profile-header';
import { ProfileImageDialog } from './shared/profile-image-dialog/profile-image-dialog';
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
import { EventButtonsComponent } from './shared/event-buttons/event-buttons';
import { UserItemComponent } from './shared/user-item/user-item.component';
import { UserProfileComponent } from './shared/user-profile/user-profile.component';
import { UserListComponent } from './shared/user-list/user-list.component';
import { ChatDetailComponent } from './shared/chat-detail/chat-detail.component';
import { ChatItemComponent } from './shared/chat-item/chat-item.component';
import { ChatListComponent } from './shared/chat-list/chat-list.component';
import { MessageBubbleComponent } from './shared/message-bubble/message-bubble.component';
import { ChatService } from './services/chat.service';
import { UserService } from './services/user.service';
import { StatusComponent } from './shared/status/status.component';
import { ContentMusicComponent } from './shared/content-music/content-music';
import { MediaPlayerComponent } from './shared/media-player/media-player';
import { DateComponent } from './shared/date/date';
import { ContentPodcastComponent } from './shared/content-podcast/content-podcast';
import { MatSliderModule } from '@angular/material/slider';
import { TimePipe } from './shared/time.pipe';
import { QueueComponent } from './queue/queue';
import { MessagesComponent } from './messages/messages';
import { MessageComponent } from './message/message';
import { DevelopmentComponent } from './development/development';
import { RelayComponent } from './shared/relay/relay';
import { RelaysComponent } from './shared/relays/relays';
import { LabelsComponent } from './shared/labels/labels';
import { EventComponent } from './shared/event/event';
import { NotificationsComponent } from './notifications/notifications';
import { NotificationLabelComponent } from './shared/notification-label/notification-label';
import { RelayListComponent } from './shared/relay-list/relay-list';
import { AddRelayDialog } from './shared/add-relay-dialog/add-relay-dialog';
import { AddMediaDialog } from './queue/add-media-dialog/add-media-dialog';
import { ConnectKeyComponent } from './connect/key/key';
import { PasswordDialog } from './shared/password-dialog/password-dialog';
import { UsernamePipe } from './shared/username';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { EditorComponent } from './editor/editor';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ArticleComponent } from './article/article';
import { LabelPipe } from './shared/label.pipe';
import { LabelComponent } from './shared/label/label';
import { RelaysManagementComponent } from './relays/relays';
import { BadgesComponent } from './badges/badges';
import { LoginComponent } from './connect/login/login';
import { ConsentDialog } from './connect/consent-dialog/consent-dialog';
import { CreateProfileComponent } from './connect/create/create';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { QrScanDialog } from './connect/key/qr-scan-dialog/qr-scan';
import { ContentEditorDirective } from './shared/content-input-directive/content-input.directive';
import { ContentInputHeightDirective } from './shared/content-input-directive/content-input-height.directive';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { LoggerModule } from '@blockcore/ngx-logger';
import { NgxLoggerLevel, TOKEN_LOGGER_WRITER_SERVICE } from '@blockcore/ngx-logger';
import { LogWriterService } from './services/log-writer';

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}
import { ZapDialogComponent } from './shared/zap-dialog/zap-dialog.component';
import { QRCodeModule } from 'angularx-qrcode';
import { ZapQrCodeComponent } from './shared/zap-qr-code/zap-qr-code.component';
import { EditorBadgesComponent } from './editor-badges/editor';
import { BadgeCardComponent } from './shared/badge-card/badge-card';
import { TagsComponent } from './shared/tags/tags';
import { BadgeComponent } from './badge/badge';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { DragScrollModule } from 'ngx-drag-scroll';
import { ZappersListDialogComponent } from './shared/zappers-list-dialog/zappers-list-dialog.component';
import { ExampleComponent } from './example/example';
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
    EventActionsComponent,
    ChatComponent,
    FeedComponent,
    EventThreadComponent,
    EventReactionsComponent,
    ContentPhotosComponent,
    FollowingComponent,
    FollowersComponent,
    ProfileWidgetComponent,
    EventButtonsComponent,
    UserItemComponent,
    UserProfileComponent,
    UserListComponent,
    ChatDetailComponent,
    ChatItemComponent,
    ChatListComponent,
    MessageBubbleComponent,
    StatusComponent,
    ContentMusicComponent,
    MediaPlayerComponent,
    DateComponent,
    ContentPodcastComponent,
    TimePipe,
    QueueComponent,
    MessagesComponent,
    MessageComponent,
    DevelopmentComponent,
    RelayComponent,
    RelaysComponent,
    LabelsComponent,
    EventComponent,
    NotificationsComponent,
    NotificationLabelComponent,
    RelayListComponent,
    AddMediaDialog,
    ConnectKeyComponent,
    PasswordDialog,
    UsernamePipe,
    EditorComponent,
    ArticleComponent,
    LabelComponent,
    LabelPipe,
    RelaysManagementComponent,
    BadgesComponent,
    LoginComponent,
    ConsentDialog,
    CreateProfileComponent,
    QrScanDialog,
    ContentEditorDirective,
    ContentInputHeightDirective,
    ZapQrCodeComponent,
    ZapDialogComponent,
    EditorBadgesComponent,
    BadgeCardComponent,
    TagsComponent,
    BadgeComponent,
    ZappersListDialogComponent,
    ExampleComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },

    }),
    LoggerModule.forRoot(
      { level: NgxLoggerLevel.INFO, enableSourceMaps: true, serverLogLevel: NgxLoggerLevel.OFF }, // Don't send logs anywhere!
      {
        writerProvider: {
          provide: TOKEN_LOGGER_WRITER_SERVICE,
          useClass: LogWriterService,
        },
      }
    ),
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
    MatSliderModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatDialogModule,
    MatDatepickerModule,
    MatButtonToggleModule,
    ScrollingModule,
    PhotoGalleryModule,
    ClipboardModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    NgxMatTimepickerModule,
    NgxColorsModule,
    QRCodeModule,
    DragScrollModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // enabled: true,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  exports: [],
  providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }, AuthGuardService, AppUpdateService, CheckForUpdateService, ChatService, UserService],
  bootstrap: [AppComponent],
})
export class AppModule {}
