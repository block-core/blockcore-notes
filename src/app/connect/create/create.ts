import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Relay, Event, utils, getPublicKey, nip19, kinds, getEventHash, validateEvent, signEvent } from 'nostr-tools';
import { privateKeyFromSeedWords, generateSeedWords } from 'nostr-tools/nip06';
import { AuthenticationService } from '../../services/authentication';
import { SecurityService } from '../../services/security';
import { ThemeService } from '../../services/theme';
import { ProfileService } from '../../services/profile';
import { Utilities } from 'src/app/services/utilities';
import { DataService } from 'src/app/services/data';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

@Component({
  selector: 'app-create',
  templateUrl: './create.html',
  styleUrls: ['../connect.css', './create.css'],
  imports: [MatIconModule, 
    ClipboardModule,
    CommonModule,
    MatCardModule, FormsModule, MatInputModule, TranslateModule]
})
export class CreateProfileComponent {
  privateKey: string = '';
  privateKeyHex: string = '';
  publicKey: string = '';
  publicKeyHex: string = '';
  password: string = '';
  error: string = '';
  profile: any = {};
  step = 1;
  mnemonic = '';

  constructor(
    private utilities: Utilities,
    private dataService: DataService,
    private profileService: ProfileService,
    private authService: AuthenticationService,
    public theme: ThemeService,
    private router: Router,
    private security: SecurityService
  ) {}

  ngOnInit() {
    // this.mnemonic = bip39.generateMnemonic(wordlist);
    this.mnemonic = generateSeedWords();

    const privateKey = privateKeyFromSeedWords(this.mnemonic);
    const secretKeyHex = bytesToHex(privateKey);
    this.privateKeyHex = secretKeyHex;
    debugger;
    // TODO: Verify if this work.
    this.privateKey = nip19.nsecEncode(hexToBytes(this.privateKeyHex));

    this.updatePublicKey();
    // const masterSeed = bip39.mnemonicToSeedSync(this.mnemonic);
  }

  async connect() {
    const userInfo = await this.authService.login();

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  async anonymous(readOnlyKey?: string) {
    const userInfo = await this.authService.anonymous(readOnlyKey);

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  async persistKey() {
    setTimeout(async () => {
      if (!this.privateKeyHex) {
        return;
      }

      if (!this.publicKeyHex) {
        return;
      }

      // First attempt to get public key from the private key to see if it's possible:
      const encrypted = await this.security.encryptData(this.privateKeyHex, this.password);
      const decrypted = await this.security.decryptData(encrypted, this.password);

      if (this.privateKeyHex == decrypted) {
        localStorage.setItem('blockcore:notes:nostr:prvkey', encrypted);
        localStorage.setItem('blockcore:notes:nostr:pubkey', this.publicKeyHex);

        this.profile.npub = this.publicKey;
        this.profile.pubkey = this.publicKeyHex;

        // Create and sign the profile event.
        const profileContent = this.utilities.reduceProfile(this.profile!);
        let unsignedEvent = this.dataService.createEventWithPubkey(kinds.Metadata, JSON.stringify(profileContent), this.publicKeyHex);
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

        this.profileService.newProfileEvent = signedEvent;

        this.router.navigateByUrl('/');
      } else {
        this.error = 'Unable to encrypt and decrypt. Cannot continue.';
        console.error(this.error);
      }

      // this.hidePrivateKey = false;
    }, 10);
  }

  updatePublicKey() {
    this.error = '';
    this.publicKey = '';
    this.privateKeyHex = '';

    if (!this.privateKey) {
      this.publicKey = '';
      return;
    }

    if (this.privateKey.startsWith('npub')) {
      this.error = 'The key value must be a "nsec" value. You entered "npub", which is your public key.';
      return;
    }

    if (this.privateKey.startsWith('nsec')) {
      this.privateKeyHex = nip19.decode(this.privateKey).data as any;
    } else {
      this.privateKeyHex = this.privateKey;
    }

    try {
      this.publicKeyHex = getPublicKey(hexToBytes(this.privateKeyHex));
      this.publicKey = nip19.npubEncode(this.publicKeyHex);
    } catch (err: any) {
      this.error = err.message;
    }
  }
}
