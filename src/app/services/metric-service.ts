import { Injectable } from '@angular/core';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root',
})
export class MetricService {
  constructor(private storage: StorageService) {}

  get users(): { [pubKey: string]: number } {
    if (!this.storage.state?.metrics?.users) {
      this.storage.state.metrics = { users: {} };
    }

    return this.storage.state.metrics.users;
  }

  increase(value: number, pubKey: string) {
    let existingMetric = this.users[pubKey];

    if (!existingMetric) {
      existingMetric = 0;
    }

    this.users[pubKey] = existingMetric + value;
  }

  decrease(value: number, pubKey: string) {
    let existingMetric = this.users[pubKey];

    if (!existingMetric) {
      existingMetric = 0;
    }

    this.users[pubKey] = existingMetric - value;
  }

  get(pubKey: string) {
    let value = this.users[pubKey];

    if (!value) {
      return 0;
    }

    return value;
  }
}
