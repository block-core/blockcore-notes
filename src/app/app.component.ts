import { Component, ViewChild } from '@angular/core';
import { ApplicationState } from './services/applicationstate.service';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild('draweraccount') draweraccount!: MatSidenav;
  authenticated = false;
  

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
    private feedService: FeedService
  ) {
    // appState.title = 'Blockcore Notes';

    this.authService.authInfo$.subscribe((auth) => {
      this.authenticated = auth.authenticated();
    });
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

  async ngOnInit() {
    await this.storage.open();
    await this.storage.initialize();

    await this.feedService.initialize();

    // const testdata = await this.storage.get('123');
    // console.log(testdata);

    // await this.storage.putProfile('123', { about: 'Hi', name: 'Name', picture: '' });

    // const testdata = await this.storage.get('123', 'profile');
    // console.log(testdata);
  }
}
