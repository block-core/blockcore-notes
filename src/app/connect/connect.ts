import { Component, NgZone, signal, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { AuthenticationService } from '../services/authentication';
import { RelayService } from '../services/relay';
import { ThemeService } from '../services/theme';
import { Utilities } from '../services/utilities';
import { ConsentDialog } from './consent-dialog/consent-dialog';
import { SpacesService } from '../services/spaces';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-connect',
    templateUrl: './connect.html',
    styleUrls: ['./connect.css'],
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatCardModule,
      MatButtonModule,
      MatInputModule,
      MatIconModule,
      MatCheckboxModule,
      FormsModule
    ]
})
export class ConnectComponent {
  extensionDiscovered = signal<boolean>(false);
  searchingForExtension = signal<boolean>(true);
  showReadOnly = signal<boolean>(false);
  readOnlyKey = signal<string>('');
  publicKey = signal<string | undefined>(undefined);
  error = signal<string>('');
  openIndentity = signal<any>(undefined);
  
  constructor(
    private spacesService: SpacesService,
    private dialog: MatDialog,
    private zone: NgZone,
    private relayService: RelayService,
    private utilities: Utilities,
    private authService: AuthenticationService,
    public theme: ThemeService,
    private router: Router,
    private appState: ApplicationState
  ) {}

  async connect() {
    const userInfo = await this.authService.login();

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  async anonymous() {
    const userInfo = await this.authService.anonymous(this.readOnlyKey());

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  toggleReadOnly() {
    this.showReadOnly.update(value => !value);
  }

  updatePublicKey() {
    this.error.set('');
    this.publicKey.set('');

    const currentReadOnlyKey = this.readOnlyKey();
    
    if (!currentReadOnlyKey) {
      this.publicKey.set('');
      return;
    }

    if (currentReadOnlyKey.startsWith('nsec')) {
      this.error.set('The key value must be a "npub" value. You entered "nsec", which is your private key. Never reveal your private key!');
      return;
    }

    try {
      const publicKey = this.utilities.ensureHexIdentifier(currentReadOnlyKey);
      this.publicKey.set(publicKey);
    } catch (err: any) {
      this.error.set(err.message);
    }
  }

  ngOnInit() {
    this.appState.updateTitle('Connect');
    this.appState.showBackButton = false;
  }

  onSubmit() {
    this.connect();
  }
}
