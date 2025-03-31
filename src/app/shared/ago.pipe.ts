import { Pipe, PipeTransform } from '@angular/core';
import { DateUtilsService } from '../services/date-utils.service';

@Pipe({
    name: 'ago',
    standalone: true
})
export class AgoPipe implements PipeTransform {
  constructor(private dateUtils: DateUtilsService) {}
  
  transform(value?: number): string {
    if (!value) {
      return '';
    }
    
    return this.dateUtils.getRelativeTimeString(value);
  }
}
