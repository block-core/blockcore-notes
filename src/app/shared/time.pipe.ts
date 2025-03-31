import { Pipe, PipeTransform } from '@angular/core';
import { Utilities } from '../services/utilities';

@Pipe({
    name: 'time',
    standalone: true
})
export class TimePipe implements PipeTransform {
  constructor(private utilities: Utilities) {}

  transform(value?: number): string {
    if (!value) {
      return '00:00:00';
    }

    return TimePipe.time(value);
  }

  static time(value: number): string {
    const hours = Math.floor(value / 60 / 60);
    const minutes = Math.floor(value / 60) - hours * 60;
    const seconds = Math.floor(value % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
