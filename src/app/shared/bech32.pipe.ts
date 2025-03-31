import { Pipe, PipeTransform } from '@angular/core';
import { Utilities } from '../services/utilities';

@Pipe({
    name: 'bech32',
    standalone: true
})
export class Bech32Pipe implements PipeTransform {
  constructor(private utilities: Utilities) {}

  transform(value: string): string {
    if (!value) {
      return value;
    }

    if (!value.startsWith('npub')) {
      return this.utilities.getNostrIdentifier(value);
    }

    return value;
  }
}
