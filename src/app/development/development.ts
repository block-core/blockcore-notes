import { Component, signal } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { DataService } from '../services/data';
import { NostrService } from '../services/nostr';
import { RelayService } from '../services/relay';
import { RelayType } from '../types/relay';
import { Storage } from '../types/storage';
import { State, StateService } from '../services/state';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-development',
    templateUrl: './development.html',
    styleUrls: ['./development.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatDividerModule
    ]
})
export class DevelopmentComponent {
  worker = signal<Worker | undefined>(undefined);
  storage = signal<Storage | undefined>(undefined);
  sub = signal<string | undefined>(undefined);

  constructor(
    public state: State,
    private nostr: NostrService, 
    private dataService: DataService, 
    private appState: ApplicationState, 
    public relayService: RelayService
  ) {}

  ngOnInit() {
    this.appState.updateTitle('Development & Debug');
  }

  async addRelays() {
    this.relayService.appendRelays(this.nostr.defaultRelays);
  }

  downloadProfile() {
    this.relayService.enque({ identifier: this.appState.getPublicKey(), type: 'Profile' });
  }

  subscription() {
    this.sub.set(this.relayService.subscribe([{ authors: [this.appState.getPublicKey()], kinds: [1] }]).id);
  }

  unsubscribe() {
    if (this.sub()) {
      this.relayService.unsubscribe(this.sub()!);
      this.sub.set(undefined);
    }
  }

  terminate() {
    this.relayService.workers[0].terminate();
  }

  ngOnDestroy() {
    const currentWorker = this.worker();
    if (currentWorker) {
      currentWorker.terminate();
    }
  }
}
