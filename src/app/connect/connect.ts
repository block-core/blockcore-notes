import { ChangeDetectorRef, NgZone } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { AuthenticationService } from '../services/authentication';
import { RelayService } from '../services/relay';
import { ThemeService } from '../services/theme';
import { Utilities } from '../services/utilities';
import { ConsentDialog } from './consent-dialog/consent-dialog';
import { SpacesService } from '../services/spaces';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.html',
  styleUrls: ['./connect.css'],
})
export class ConnectComponent {
  extensionDiscovered = false;
  timeout: any;
  consent: boolean = false;
  readOnlyLogin = false;

  constructor(
    public spacesService: SpacesService,
    public theme: ThemeService,
    private appState: ApplicationState,
    private cd: ChangeDetectorRef,
    private relayService: RelayService,
    private authService: AuthenticationService,
    private utilities: Utilities,
    private router: Router,
    private ngZone: NgZone,
    public dialog: MatDialog
  ) {}

  persist() {
    localStorage.setItem('blockcore:notes:nostr:consent', this.consent.toString());
  }

  giveConsent() {
    const dialogRef = this.dialog.open(ConsentDialog, {
      data: false,
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }

      if (result === true) {
        this.consent = true;
        this.persist();
      }
    });
  }

  async connect() {
    // if (!this.consent) {
    //   const element = document.getElementById('consent-card');
    //   // document.body.scroll(0, 5000);
    //   element!.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    //   return;
    // }

    const userInfo = await this.authService.login();

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  scroll(value: number) {
    const element = document.getElementById('container');

    if (!element) {
      console.log('NOT FOUND!');
      return;
    }

    element.scroll(0, value);

    // element.scrollIntoView();
    // element.scrollIntoView(false);
    // element.scrollIntoView({ block: 'end' });
    // element.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    // element.scrollBy({top: 500, left: 0, behavior: 'smooth'})
  }

  async anonymous(readOnlyKey?: string) {
    const userInfo = await this.authService.anonymous(readOnlyKey);

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  ngOnInit() {
    this.consent = localStorage.getItem('blockcore:notes:nostr:consent') === 'true';
    this.checkForExtension();
  }

  ngOnDestroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  readOnlyKey = 'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m';

  checkedTimes = 0;
  showInstallLink = false;
  searchingForExtension = true;

  checkForExtension() {
    this.checkedTimes++;
    const gt = globalThis as any;

    if (gt.nostr) {
      this.searchingForExtension = false;
      this.extensionDiscovered = true;
      return;
    }

    if (this.checkedTimes > 10) {
      this.searchingForExtension = false;
      this.showInstallLink = true;

      return;
    }

    this.timeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.checkForExtension();
      });
    }, 250);
  }
}
