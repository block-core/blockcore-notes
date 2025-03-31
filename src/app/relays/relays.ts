import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { ApplicationState } from '../services/applicationstate';
import { StorageService } from '../services/storage';
import { EventService } from '../services/event';
import { NostrRelay } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { RelayService } from '../services/relay';
import { ThemeService } from '../services/theme';
import { AddRelayDialog, AddRelayDialogData } from '../shared/add-relay-dialog/add-relay-dialog';
import { OptionsService } from '../services/options';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../services/data';
import { NostrService } from '../services/nostr';
import { UploadService } from '../services/upload';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RelayComponent } from '../shared/relay/relay';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-relays-management',
    templateUrl: './relays.html',
    styleUrls: ['./relays.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatCardModule,
      MatButtonModule,
      MatExpansionModule,
      MatIconModule,
      RouterModule,
      MatTabsModule,
      MatToolbarModule,
      RelayComponent,
      MatProgressSpinnerModule
    ]
})
export class RelaysManagementComponent {
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  wiped = false;
  wipedNonFollow = false;
  wipedNotes = false;
  open = false;

  constructor(
    public uploadService: UploadService,
    private nostr: NostrService,
    public optionsService: OptionsService,
    public relayService: RelayService,
    public dialog: MatDialog,
    public appState: ApplicationState,
    private profileService: ProfileService,
    public theme: ThemeService,
    public db: StorageService,
    private snackBar: MatSnackBar,
    public dataService: DataService
  ) {}

  toggle() {
    if (this.open) {
      this.open = false;
      this.accordion.closeAll();
    } else {
      this.open = true;
      this.accordion.openAll();
    }
  }

  openMediaPlayer() {
    this.optionsService.values.showMediaPlayer = true;
  }

  async primaryRelay(relay: NostrRelay) {
    this.optionsService.values.primaryRelay = relay.url;
    this.optionsService.save();
  }

  async deleteRelays() {
    await this.relayService.deleteRelays([]);
  }

  async clearProfileCache() {
    this.wipedNonFollow = true;
  }

  async clearNotesCache() {
    this.wipedNotes = true;
  }

  async getDefaultRelays() {
    await this.relayService.appendRelays(this.nostr.defaultRelays);
  }

  async getRelays() {
    const relays = await this.nostr.relays();
    await this.relayService.appendRelays(relays);
  }

  ngOnInit() {
    this.appState.updateTitle('Relays');
    this.appState.showBackButton = false;
    this.appState.actions = [
      {
        icon: 'add_circle',
        tooltip: 'Add Relay',
        click: () => {
          this.addRelay();
        },
      },
    ];
  }

  registerHandler(protocol: string, parameter: string) {
    navigator.registerProtocolHandler(protocol, `/?${parameter}=%s`);
  }

  addRelay(): void {
    const dialogRef = this.dialog.open(AddRelayDialog, {
      data: { read: true, write: true },
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result: AddRelayDialogData) => {
      if (!result) {
        return;
      }

      if (result.url.indexOf('://') === -1) {
        result.url = 'wss://' + result.url;
      }

      await this.relayService.appendRelay(result.url, result.read, result.write);
    });
  }
}
