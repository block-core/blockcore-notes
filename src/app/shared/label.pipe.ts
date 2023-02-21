import { Pipe, PipeTransform } from '@angular/core';
import { LabelService } from '../services/label';

@Pipe({ name: 'label' })
export class LabelPipe implements PipeTransform {
  constructor(private labelService: LabelService) {}

  transform(value?: string): string {
    if (!value) {
      return '';
    }

    return this.labelService.getName(value);
  }
}
