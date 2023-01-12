import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import { Utilities } from '../services/utilities';
import { circleStyles } from './defaults';

@Pipe({ name: 'circlestyle' })
export class CircleStylePipe implements PipeTransform {
  constructor() {}

  transform(value: number): string | undefined {
    if (!value) {
      return 'Pipes';
    }

    return circleStyles.find((c) => c.id == value)?.name;
  }
}
