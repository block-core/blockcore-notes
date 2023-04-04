import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import { CreateProfileComponent } from 'src/app/connect/create/create';
import { ConnectKeyComponent } from 'src/app/connect/key/key';
import { AuthenticationService } from 'src/app/services/authentication';
import { DataService } from 'src/app/services/data';
import { ProfileService } from 'src/app/services/profile';
import { SecurityService } from 'src/app/services/security';
import { ThemeService } from 'src/app/services/theme';
import { Utilities } from 'src/app/services/utilities';
import { defaultSnackBarOpts } from '../../nip76.service';
import { Nip76DemoService } from '../nip76-demo.service';



@Component({
  selector: 'app-nip76-demo-starter',
  templateUrl: './nip76-demo-starter.component.html',
  styleUrls: ['./nip76-demo-starter.component.scss']
})
export class Nip76DemoStarterComponent {
  demoUserType: 'existing' | 'new' = 'existing';
  constructor(
    private snackBar: MatSnackBar,
    private profileService: ProfileService,
    private router: Router
  ) { }

  ngOnInit() {
    this.profileService.profile$.pipe(filter(x => !!x)).subscribe(x => {
      this.router.navigateByUrl('/private-channels');
    });
  }

  copyKey(name: 'Alice' | 'Bob') {
    const key = {
      'Alice': 'nsec1y72ekupwshrl6zca2kx439uz23x4fqppc6gg9y9e5up5es06qqxqlcw698',
      'Bob': 'nsec12l6c5g8e7gt9twyctk0t073trlrf2zzs88240k3d2dmqlyh2hwhq9s2wl3'
    }[name];
    navigator.clipboard.writeText(key);
    this.snackBar.open(`${name}'s key is now in your clipboard.`, 'Hide', defaultSnackBarOpts);
  }
}

@Component({
  selector: 'nip76-demo-key',
  templateUrl: '../../../connect/key/key.html',
  styleUrls: ['../../../connect/key/key.css', '../../../connect/connect.css']
})
export class Nip76DemoKeyComponent extends ConnectKeyComponent {

  constructor(
    dialog: MatDialog,
    theme: ThemeService,
    private router1: Router,
    security: SecurityService,
    nip76DemoService: Nip76DemoService

  ) {
    super(dialog, theme, router1, security, nip76DemoService);
    this.step = 3;
  }

  override async persistKey() {
    super.persistKey();
    setTimeout(() => {
      this.router1.navigateByUrl('/private-channels');
    }, 200)
  }

}

@Component({
  selector: 'nip76-demo-create',
  templateUrl: '../../../connect/create/create.html',
  styleUrls: ['../../../connect/create/create.css', '../../../connect/connect.css']
})
export class Nip76DemoCreateComponent extends CreateProfileComponent {

  constructor(
    utilities: Utilities,
    dataService: DataService,
    profileService: ProfileService,
    authService: AuthenticationService,
    theme: ThemeService,
    private router1: Router,
    security: SecurityService,
    nip76DemoService: Nip76DemoService
  ) {
    super(utilities, dataService, profileService, authService, theme, router1, security, nip76DemoService)
  }

  override async persistKey() {
    super.persistKey();
    setTimeout(() => {
      this.router1.navigateByUrl('/private-channels');
    }, 200)
  }
}

