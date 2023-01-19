import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import { Utilities } from '../services/utilities';

@Pipe({ name: 'time' })
export class TimePipe implements PipeTransform {
  constructor(private utilities: Utilities) {}

  transform(value?: number): string {
    if (!value) {
      return '00:00:00';
    }

    return TimePipe.time(value);
  }

  static time(value: number) {
    var hours = Math.floor(value / 60 / 60);
    var minutes = Math.floor(value / 60) - hours * 60;
    var seconds = value % 60;
    var formatted = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    return formatted;
  }
}
