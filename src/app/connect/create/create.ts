import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { relayInit, Relay, Event, utils, getPublicKey, nip19, nip06, Kind, getEventHash, validateEvent, signEvent } from 'nostr-tools';
import { AuthenticationService } from '../../services/authentication';
import { SecurityService } from '../../services/security';
import { ThemeService } from '../../services/theme';
import { ProfileService } from '../../services/profile';
import { Utilities } from 'src/app/services/utilities';
import { DataService } from 'src/app/services/data';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-create',
    templateUrl: './create.html',
    styleUrls: ['../connect.css', './create.css'],
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      MatCardModule,
      MatInputModule,
      MatButtonModule,
      MatIconModule,
      MatStepperModule,
      RouterModule,
      MatDividerModule
    ]
})
export class CreateProfileComponent {
  privateKey = signal<string>('');
  privateKeyHex = signal<string>('');
  publicKey = signal<string>('');
  publicKeyHex = signal<string>('');
  password = signal<string>('');
  error = signal<string>('');
  profile = signal<any>({});
  step = signal<number>(1);
  mnemonic = signal<string>('');

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
    const generatedMnemonic = nip06.generateSeedWords();
    this.mnemonic.set(generatedMnemonic);
    
    const generatedPrivateKey = nip06.privateKeyFromSeedWords(generatedMnemonic);
    this.privateKeyHex.set(generatedPrivateKey);
    this.privateKey.set(nip19.nsecEncode(generatedPrivateKey));

    this.updatePublicKey();
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
      const currentPrivateKeyHex = this.privateKeyHex();
      const currentPublicKeyHex = this.publicKeyHex();
      const currentPassword = this.password();
      
      if (!currentPrivateKeyHex || !currentPublicKeyHex) {
        return;
      }

      // First attempt to get public key from the private key to see if it's possible:
      const encrypted = await this.security.encryptData(currentPrivateKeyHex, currentPassword);
      const decrypted = await this.security.decryptData(encrypted, currentPassword);

      if (currentPrivateKeyHex === decrypted) {
        localStorage.setItem('blockcore:notes:nostr:prvkey', encrypted);
        localStorage.setItem('blockcore:notes:nostr:pubkey', currentPublicKeyHex);

        const currentProfile = this.profile();
        currentProfile.npub = this.publicKey();
        currentProfile.pubkey = currentPublicKeyHex;

        // Create and sign the profile event.
        const profileContent = this.utilities.reduceProfile(currentProfile);
        let unsignedEvent = this.dataService.createEventWithPubkey(Kind.Metadata, JSON.stringify(profileContent), currentPublicKeyHex);
        let signedEvent = unsignedEvent as Event;
        signedEvent.id = await getEventHash(unsignedEvent);

        if (!validateEvent(signedEvent)) {
          this.error.set('Unable to validate the event. Cannot continue.');
          return;
        }

        const signature = signEvent(signedEvent, currentPrivateKeyHex) as any;
        signedEvent.sig = signature;

        // Make sure we reset the secrets.
        this.mnemonic.set('');
        this.privateKey.set('');
        this.privateKeyHex.set('');
        this.publicKey.set('');
        this.publicKeyHex.set('');
        this.password.set('');
        this.profile.set(null);

        this.profileService.newProfileEvent = signedEvent;

        this.router.navigateByUrl('/');
      } else {
        this.error.set('Unable to encrypt and decrypt. Cannot continue.');
        console.error(this.error());
      }

    }, 10);
  }

  updatePublicKey() {
    this.error.set('');
    this.publicKey.set('');
    this.privateKeyHex.set('');

    const currentPrivateKey = this.privateKey();
    
    if (!currentPrivateKey) {
      this.publicKey.set('');
      return;
    }

    if (currentPrivateKey.startsWith('npub')) {
      this.error.set('The key value must be a "nsec" value. You entered "npub", which is your public key.');
      return;
    }

    let privateKeyHexValue = '';
    
    if (currentPrivateKey.startsWith('nsec')) {
      privateKeyHexValue = nip19.decode(currentPrivateKey).data as any;
    } else {
      privateKeyHexValue = currentPrivateKey;
    }

    this.privateKeyHex.set(privateKeyHexValue);

    try {
      const publicKeyHexValue = getPublicKey(privateKeyHexValue);
      this.publicKeyHex.set(publicKeyHexValue);
      this.publicKey.set(nip19.npubEncode(publicKeyHexValue));
    } catch (err: any) {
      this.error.set(err.message);
    }
  }
}
