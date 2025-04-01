import { Component, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { ApplicationState } from './services/applicationstate';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, RouterModule, TitleStrategy } from '@angular/router';
import { AuthenticationService } from './services/authentication';
import { AppUpdateService } from './services/app-update';
import { CheckForUpdateService } from './services/check-for-update';
import { MatDialog } from '@angular/material/dialog';
import { NoteDialog } from './shared/create-note-dialog/create-note-dialog';
import { Observable, map, shareReplay, startWith, debounceTime, tap } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { JsonPipe, Location, CommonModule } from '@angular/common';
import { RelayService } from './services/relay';
import { DataService } from './services/data';
import { ProfileService } from './services/profile';
import { NavigationService } from './services/navigation';
import { NostrProfileDocument } from './services/interfaces';
import { ThemeService } from './services/theme';
import { NostrProtocolRequest } from './common/NostrProtocolRequest';
import { SearchService } from './services/search';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CircleService } from './services/circle';
import { StorageService } from './services/storage';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { UIService } from './services/ui';
import { OptionsService } from './services/options';
import { LabelService } from './services/label';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BadgeService } from './services/badge';
import { State } from './services/state';
import { EventService } from './services/event';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTreeModule } from '@angular/material/tree';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRippleModule } from '@angular/material/core';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MediaPlayerComponent } from './shared/media-player/media-player';
import { NgxLoadingButtonsModule } from 'ngx-loading-buttons';
import { LoggerService } from './services/logger';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatInputModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    MatChipsModule,
    MatStepperModule,
    MatTreeModule,
    MatBadgeModule,
    MatMenuModule,
    MatGridListModule,
    MatCardModule,
    MatRadioModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRippleModule,
    MatSortModule,
    MatDividerModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSliderModule,
    RouterModule, 
    MediaPlayerComponent,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    NgxLoadingButtonsModule,

  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild('draweraccount') draweraccount!: MatSidenav;
  @ViewChild('searchInput') searchInput!: ElementRef;
  authenticated = false;
  bgimagePath = '/assets/profile-bg.png';
  profile: NostrProfileDocument | undefined;
  visibilityHandler: any;
  searchControl: FormControl = new FormControl();
  logger = inject(LoggerService);

  constructor(
    private cd: ChangeDetectorRef,
    public options: OptionsService,
    private db: StorageService,
    public appState: ApplicationState,
    public authService: AuthenticationService,
    private router: Router,
    public appUpdateService: AppUpdateService,
    public appUpdateCheckService: CheckForUpdateService,
    public dialog: MatDialog,
    private location: Location,
    private labelService: LabelService,
    private breakpointObserver: BreakpointObserver,
    private relayService: RelayService,
    private dataService: DataService,
    private circleService: CircleService,
    public profileService: ProfileService,
    private badgeService: BadgeService,
    public navigationService: NavigationService,
    public translate: TranslateService,
    public ui: UIService,
    private bottomSheet: MatBottomSheet,
    public searchService: SearchService,
    public theme: ThemeService,
    private state: State,
    private eventService: EventService,
    private optionService: OptionsService
  ) {
    if (!this.visibilityHandler) {
      this.visibilityHandler = addEventListener('visibilitychange', (event) => {
        this.appState.visibility(document.visibilityState === 'visible');
      });
    }

    this.displayLabels = !this.options.values.hideSideLabels;

    // This must happen in the constructor on app component, or when loading in PWA, it won't
    // be possible to read the query parameters.
    const queryParam = globalThis.location.search;

    if (queryParam) {
      const param = Object.fromEntries(new URLSearchParams(queryParam)) as any;
      this.appState.params = param;

      if (this.appState.params.nostr) {
        const protocolRequest = new NostrProtocolRequest();
        const protocolData = protocolRequest.decode(this.appState.params.nostr);

        if (protocolData && protocolData.scheme && protocolData.address) {
          const prefix = protocolData.scheme === 'nevent' ? '/e' : '/p';
          this.router.navigate([prefix, protocolData.address!]);
        }
      }
    }

    this.authService.authInfo$.subscribe(async (auth) => {
      this.state.pubkey = auth.publicKeyHex;


      this.authenticated = auth.authenticated();

      if (this.authenticated) {
        await this.initialize();
      }
    });

    this.profileService.profile$.subscribe((profile) => {
      this.profile = profile;
    });
  }

  displayLabels = true;

  toggleMenuSize() {
    this.displayLabels = !this.displayLabels;
    this.cd.detectChanges();

    setTimeout(() => {
      this.options.values.hideSideLabels = !this.displayLabels;
      this.options.save();
    }, 250);

    // this._container._ngZone.onMicrotaskEmpty.subscribe(() => {
    //   this._container._updateStyles();
    //   this._container._changeDetectorRef.markForCheck();
    // });
  }

  searchInputChanged() {
    if (this.appState.searchText) {
      this.searchService.search(this.appState.searchText);
    }
  }

  // ngAfterViewInit() {
  //   setTimeout(() => {
  //     this.showMenu = true;
  //   }, 0);
  //   this._container._ngZone.onMicrotaskEmpty.subscribe(() => {
  //     this._container._updateStyles();
  //     this._container._changeDetectorRef.markForCheck();
  //   });
  // }

  searchVisibility(visible: boolean) {
    this.appState.showSearch = visible;
    this.appState.searchText = '';

    if (visible) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
      });
    }
  }

  isHandset$: Observable<boolean> = this.breakpointObserver.observe('(max-width: 599px)').pipe(
    map((result) => result.matches),
    shareReplay()
  );

  goBack() {
    if (this.appState.backUrl) {
      this.router.navigateByUrl(this.appState.backUrl);
      this.appState.backUrl = undefined;
    } else {
      this.appState.navigateBack();
    }
  }

  toggleMenu() {
    if (this.breakpointObserver.isMatched('(max-width: 599px)')) {
      this.drawer.toggle();
    }
  }

  openProfile() {
    this.router.navigateByUrl('/profile');
    this.toggleProfileMenu();
  }

  toggleProfileMenu() {
    this.draweraccount.toggle();
  }

  openMediaPlayer() {
    this.optionService.values.showMediaPlayer = true;
  }

  /** Run initialize whenever user has been authenticated. */
  async initialize() {
    this.logger.info('INITIALIZE IS RUNNING....');

    // this.translate.addLangs(['ar', 'el', 'en', 'fa', 'fr', 'he', 'no', 'ru']);
    // availible language translations 
    this.translate.addLangs(['en', 'no', 'ru']);
    this.translate.setDefaultLang('en');

    if (this.options.values.language) {
      this.appState.setLanguage(this.options.values.language);

      // This is a copy from settings.ts
      const rtlLanguages: string[] = ['ar', 'fa', 'he'];

      if (rtlLanguages.includes(this.options.values.language)) {
        this.appState.documentDirection = 'rtl';
        this.options.values.dir = 'rtl';
      } else {
        this.appState.documentDirection = 'ltr';
        this.options.values.dir = 'ltr';
      }
    }

    // await this.storage.open();
    // await this.storage.initialize();
    await this.db.initialize('blockcore-' + this.appState.getPublicKey());

    await this.circleService.initialize();

    await this.profileService.initialize(this.appState.getPublicKey());
    // await this.relayStorage.initialize();

    await this.relayService.initialize();

    await this.badgeService.initialize();
    // await this.relayService.connect();

    // await this.feedService.initialize();

    // This service will perform data cleanup, etc.
    await this.dataService.initialize();

    await this.labelService.initialize();

    this.appState.connected$.subscribe(() => {
      this.logger.info('Connected to relay.. this can sometimes be triggered multiple times.');

      if (this.profileService.newProfileEvent) {
        // Wait for more relays to be connected.
        setTimeout(async () => {
          const profile = JSON.parse(this.profileService.newProfileEvent!.content);
          profile.id = this.profileService.newProfileEvent?.id;
          profile.pubkey = this.profileService.newProfileEvent?.pubkey;

          // Use the whole document for this update as we don't want to loose additional metadata we have, such
          // as follow (on self).
          await this.profileService.updateProfile(profile.pubkey, profile);

          await this.dataService.publishEvent(this.profileService.newProfileEvent!);

          this.profileService.newProfileEvent = undefined;
        }, 1000);
      }
    });

    // this.relayService.

    // .subscribe(async (profile) => {
    //   // TODO: Figure out why we get promises from this observable.
    //   const p = await profile;

    //   if (!p) {
    //     return;
    //   }

    //   await this.profileService.updateProfile(p.pubkey, p);
    // });

    this.appState.setInitialized();
  }

  discoveredProfileDate = 0;
  sharedWorker?: SharedWorker;

  async ngOnInit() {
    this.theme.init();

    this.sharedWorker = new SharedWorker('/assets/shared.worker.js');
    this.sharedWorker.port.onmessage = (ev: any) => {
      this.logger.info('Shared worker message received:', ev.data);
    };
    this.sharedWorker.port.start();

    this.searchControl.valueChanges.subscribe(async (value) => {
      this.appState.searchText = value;

      if (!value) {
        return;
      }

      if (value.length <= 1) {
        return;
      }

      await this.searchService.search(value);
    });

    // const testdata = await this.storage.get('123');
    // console.log(testdata);
    // await this.storage.putProfile('123', { about: 'Hi', name: 'Name', picture: '' });
    // const testdata = await this.storage.get('123', 'profile');
    // console.log(testdata);
  }
}
