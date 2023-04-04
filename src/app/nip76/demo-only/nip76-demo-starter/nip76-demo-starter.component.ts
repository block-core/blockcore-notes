import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Nip76WebWalletStorage } from 'animiq-nip76-tools';
import { Kind, getEventHash, validateEvent, signEvent, Event } from 'nostr-tools';
import { CreateProfileComponent } from 'src/app/connect/create/create';
import { ConnectKeyComponent } from 'src/app/connect/key/key';
import { AuthenticationService } from 'src/app/services/authentication';
import { DataService } from 'src/app/services/data';
import { ProfileService } from 'src/app/services/profile';
import { SecurityService } from 'src/app/services/security';
import { ThemeService } from 'src/app/services/theme';
import { Utilities } from 'src/app/services/utilities';
import { defaultSnackBarOpts, Nip76Service } from '../../nip76.service';



@Component({
  selector: 'app-nip76-demo-starter',
  templateUrl: './nip76-demo-starter.component.html',
  styleUrls: ['./nip76-demo-starter.component.scss']
})
export class Nip76DemoStarterComponent {
  demoUserType: 'existing' | 'new' = 'existing';
  constructor(private snackBar: MatSnackBar) {

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
    private security1: SecurityService,
    private nip76Service: Nip76Service
  ) {
    super(dialog, theme, router1, security1);
    this.step = 3;
  }

  /**
   * same as base class persistKey but with Nip76 wallet creation and redirection to private-channels
   */
  override async persistKey() {

    setTimeout(async () => {
      if (!this.privateKeyHex) {
        return;
      }

      if (!this.publicKeyHex) {
        return;
      }

      // First attempt to get public key from the private key to see if it's possible:
      const encrypted = await this.security1.encryptData(this.privateKeyHex, this.password);
      const decrypted = await this.security1.decryptData(encrypted, this.password);

      if (this.privateKeyHex == decrypted) {
        localStorage.setItem('blockcore:notes:nostr:prvkey', encrypted);
        localStorage.setItem('blockcore:notes:nostr:pubkey', this.publicKeyHex);
        this.nip76Service.wallet = await Nip76WebWalletStorage.fromStorage({
          publicKey: this.publicKeyHex,
          privateKey: this.privateKeyHex
        });
        this.nip76Service.wallet.saveWallet(this.privateKeyHex);

        this.reset();

        this.router1.navigateByUrl('/private-channels');
        // window.location.href = '/private-channels';
      } else {
        this.error = 'Unable to encrypt and decrypt. Cannot continue.';
        console.error(this.error);
      }

      // this.hidePrivateKey = false;
    }, 10);
  }

}

@Component({
  selector: 'nip76-demo-create',
  templateUrl: '../../../connect/create/create.html',
  styleUrls: ['../../../connect/create/create.css', '../../../connect/connect.css']
})
export class Nip76DemoCreateComponent extends CreateProfileComponent {

  constructor(
    private utilities1: Utilities,
    private dataService1: DataService,
    private profileService1: ProfileService,
    authService: AuthenticationService,
    theme: ThemeService,
    private router1: Router,
    private security1: SecurityService,
    private nip76Service: Nip76Service
  ) {
    super(utilities1, dataService1, profileService1, authService, theme, router1, security1)
  }

  /**
   * same as base class persistKey but with Nip76 wallet creation and redirection to private-channels
   */
  override async persistKey() {
    setTimeout(async () => {
      if (!this.privateKeyHex) {
        return;
      }

      if (!this.publicKeyHex) {
        return;
      }

      // First attempt to get public key from the private key to see if it's possible:
      const encrypted = await this.security1.encryptData(this.privateKeyHex, this.password);
      const decrypted = await this.security1.decryptData(encrypted, this.password);

      if (this.privateKeyHex == decrypted) {
        localStorage.setItem('blockcore:notes:nostr:prvkey', encrypted);
        localStorage.setItem('blockcore:notes:nostr:pubkey', this.publicKeyHex);

        this.nip76Service.wallet = await Nip76WebWalletStorage.fromStorage({
          publicKey: this.publicKeyHex,
          privateKey: this.privateKeyHex
        });
        this.nip76Service.wallet.saveWallet(this.privateKeyHex);

        this.profile.npub = this.publicKey;
        this.profile.pubkey = this.publicKeyHex;

        // Create and sign the profile event.
        const profileContent = this.utilities1.reduceProfile(this.profile!);
        let unsignedEvent = this.dataService1.createEventWithPubkey(Kind.Metadata, JSON.stringify(profileContent), this.publicKeyHex);
        let signedEvent = unsignedEvent as Event;
        signedEvent.id = await getEventHash(unsignedEvent);

        if (!validateEvent(signedEvent)) {
          this.error = 'Unable to validate the event. Cannot continue.';
        }

        const signature = signEvent(signedEvent, this.privateKeyHex) as any;
        signedEvent.sig = signature;

        // Make sure we reset the secrets.
        this.mnemonic = '';
        this.privateKey = '';
        this.privateKeyHex = '';
        this.publicKey = '';
        this.publicKeyHex = '';
        this.password = '';
        this.profile = null;

        this.profileService1.newProfileEvent = signedEvent;

        this.router1.navigateByUrl('/private-channels');
      } else {
        this.error = 'Unable to encrypt and decrypt. Cannot continue.';
        console.error(this.error);
      }

      // this.hidePrivateKey = false;
    }, 10);
  }
}

