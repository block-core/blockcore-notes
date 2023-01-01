import { Component, ViewChild } from '@angular/core';
import { ApplicationState } from './services/applicationstate.service';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, TitleStrategy } from '@angular/router';
import { AuthenticationService } from './services/authentication.service';
import { AppUpdateService } from './services/app-update.service';
import { CheckForUpdateService } from './services/check-for-update.service';
import { StorageService } from './services/storage.service';
import { MatDialog } from '@angular/material/dialog';
import { NoteDialog } from './shared/create-note-dialog/create-note-dialog';
import { Observable, map, shareReplay } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { FeedService } from './services/feed.service';
import { RelayService } from './services/relay.service';
import { RelayStorageService } from './services/relay.storage.service';
import { DataService } from './services/data.service';
import { ProfileService } from './services/profile.service';
import { ScrollEvent } from './shared/scroll.directive';
import { NavigationService } from './services/navigation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild('draweraccount') draweraccount!: MatSidenav;
  authenticated = false;
  bgimagePath = '/assets/profile-bg.png';
  profileimagePath = '/assets/profile.png';
  constructor(
    public appState: ApplicationState,
    private storage: StorageService,
    public authService: AuthenticationService,
    private router: Router,
    public appUpdateService: AppUpdateService,
    public appUpdateCheckService: CheckForUpdateService,
    public dialog: MatDialog,
    private location: Location,
    private breakpointObserver: BreakpointObserver,
    private relayStorage: RelayStorageService,
    private feedService: FeedService,
    private relayService: RelayService,
    private dataService: DataService,
    private profileService: ProfileService,
    private navigationService: NavigationService
  ) {
    // appState.title = 'Blockcore Notes';
    console.log('CONSTRUCTOR FOR APP!');

    this.authService.authInfo$.subscribe(async (auth) => {
      this.authenticated = auth.authenticated();

      if (this.authenticated) {
        await this.initialize();
      }
    });
  }

  async onScroll(event: ScrollEvent) {
    if (event.isReachingBottom) {
      // console.log(`the user is reaching the bottom`);
      this.navigationService.showMore();

      // this.loading = true;
      // setTimeout(async () => {

      //   // await this.updateTransactions(this.link);
      //   // this.loading = false;
      // });
    }
    if (event.isReachingTop) {
      // console.log(`the user is reaching the top`);
    }
    if (event.isWindowEvent) {
      console.log(`This event is fired on Window not on an element.`);
    }
  }

  isHandset$: Observable<boolean> = this.breakpointObserver.observe('(max-width: 599px)').pipe(
    map((result) => result.matches),
    shareReplay()
  );

  goBack() {
    this.location.back();
  }

  toggleMenu() {
    if (this.breakpointObserver.isMatched('(max-width: 599px)')) {
      this.drawer.toggle();
    }
  }

  /** Run initialize whenever user has been authenticated. */
  async initialize() {
    console.log('APP:INITIALIZE');
    await this.storage.open();
    await this.storage.initialize();

    await this.profileService.populate();
    await this.relayStorage.initialize();
    await this.relayService.initialize();
    await this.relayService.connect();
    await this.feedService.initialize();

    // This service will perform data cleanup, etc.
    await this.dataService.initialize();
  }

  async ngOnInit() {
    console.log('NG INIT APP');

    console.log('NG INIT APP: PROFILE SHOULD BE LOADED BY NOW!!');

    // const testdata = await this.storage.get('123');
    // console.log(testdata);

    // await this.storage.putProfile('123', { about: 'Hi', name: 'Name', picture: '' });

    // const testdata = await this.storage.get('123', 'profile');
    // console.log(testdata);
  }
}
