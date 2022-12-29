import { Injectable } from '@angular/core';
import { NostrRelayDocument } from './interfaces';
import { StorageService } from './storage.service';
import { StorageBase } from './storage.base';

@Injectable({
  providedIn: 'root',
})
export class RelayStorageService extends StorageBase<NostrRelayDocument> {
  constructor(private service: StorageService) {
    super('relays', service);
  }
}
