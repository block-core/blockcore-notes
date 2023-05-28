import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MetricService {
  users: {
    [pubKey: string]: number;
  } = {};

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
