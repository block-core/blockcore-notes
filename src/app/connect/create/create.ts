import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { relayInit, Relay, Event, utils, getPublicKey, nip19, nip06, Kind, getEventHash, validateEvent, signEvent } from 'nostr-tools';
import { AuthenticationService } from '../../services/authentication';
import { SecurityService } from '../../services/security';
import { ThemeService } from '../../services/theme';
import { ProfileService } from '../../services/profile';
import { Utilities } from 'src/app/services/utilities';
import { DataService } from 'src/app/services/data';

@Component({
  selector: 'app-create',
  templateUrl: './create.html',
  styleUrls: ['../connect.css', './create.css'],
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
    this.mnemonic = nip06.generateSeedWords();
    this.privateKeyHex = nip06.privateKeyFromSeedWords(this.mnemonic);
    this.privateKey = nip19.nsecEncode(this.privateKeyHex);

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
        let unsignedEvent = this.dataService.createEventWithPubkey(Kind.Metadata, JSON.stringify(profileContent), this.publicKeyHex);
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
      this.publicKeyHex = getPublicKey(this.privateKeyHex);
      this.publicKey = nip19.npubEncode(this.publicKeyHex);
    } catch (err: any) {
      this.error = err.message;
    }
  }
}
