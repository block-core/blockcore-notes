import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({ name: 'ago' })
export class AgoPipe implements PipeTransform {
  transform(value?: number): string {
    if (!value) {
      return '';
    }

    const date = moment.unix(value);
    return date.fromNow();
  }
}
