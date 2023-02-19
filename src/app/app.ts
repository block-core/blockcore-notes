import { Component, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ApplicationState } from './services/applicationstate';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, TitleStrategy } from '@angular/router';
import { AuthenticationService } from './services/authentication';
import { AppUpdateService } from './services/app-update';
import { CheckForUpdateService } from './services/check-for-update';
import { MatDialog } from '@angular/material/dialog';
import { NoteDialog } from './shared/create-note-dialog/create-note-dialog';
import { Observable, map, shareReplay, startWith, debounceTime, tap } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { JsonPipe, Location } from '@angular/common';
import { RelayService } from './services/relay';
import { DataService } from './services/data';
import { ProfileService } from './services/profile';
import { NavigationService } from './services/navigation';
import { NostrProfileDocument } from './services/interfaces';
import { ThemeService } from './services/theme';
import { NostrProtocolRequest } from './common/NostrProtocolRequest';
import { SearchService } from './services/search';
import { FormControl } from '@angular/forms';
import { CircleService } from './services/circle';
import { StorageService } from './services/storage';
import { ImportSheet } from './shared/import-sheet/import-sheet';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { UIService } from './services/ui';
import { OptionsService } from './services/options';

@Component({
  selector: 'app-root',
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
    private breakpointObserver: BreakpointObserver,
    private relayService: RelayService,
    private dataService: DataService,
    private circleService: CircleService,
    public profileService: ProfileService,
    public navigationService: NavigationService,
    public ui: UIService,
    private bottomSheet: MatBottomSheet,
    public searchService: SearchService,
    public theme: ThemeService
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
      auth.publicKeyHex;

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

  /** Run initialize whenever user has been authenticated. */
  async initialize() {
    console.log('INITIALIZE IS RUNNING....');

    // await this.storage.open();
    // await this.storage.initialize();
    await this.db.initialize('blockcore-' + this.appState.getPublicKey());

    await this.circleService.initialize();

    await this.profileService.initialize(this.appState.getPublicKey());
    // await this.relayStorage.initialize();

    await this.relayService.initialize();
    // await this.relayService.connect();

    // await this.feedService.initialize();

    // This service will perform data cleanup, etc.
    await this.dataService.initialize();

    this.appState.connected$.subscribe(() => {});

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
      console.log(ev.data);
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

  openImportSheet(data: any): void {
    this.bottomSheet.open(ImportSheet, {
      data: data,
    });
  }
}
