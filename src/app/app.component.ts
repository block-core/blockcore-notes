import { Component, ViewChild } from '@angular/core';
import { ApplicationState } from './services/applicationstate.service';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { AuthenticationService } from './services/authentication.service';
import { AppUpdateService } from './services/app-update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild('draweraccount') draweraccount!: MatSidenav;
  authenticated = false;

  constructor(public appState: ApplicationState, public authService: AuthenticationService, private router: Router , public appUpdateService: AppUpdateService,) {
    appState.title = 'Blockcore Notes';

    this.authService.authInfo$.subscribe((auth) => {
      this.authenticated = auth.authenticated();
    });
  }

  goBack() {
    this.router.navigateByUrl('/');
  }
}
