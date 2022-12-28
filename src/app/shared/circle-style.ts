import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import { Utilities } from '../services/utilities.service';
import { circleStyles } from './defaults';

@Pipe({ name: 'circlestyle' })
export class CircleStylePipe implements PipeTransform {
  constructor() {}

  transform(value: string): string | undefined {
    if (!value) {
      return value;
    }

    return circleStyles.find((c) => c.id == value)?.name;
  }
}
