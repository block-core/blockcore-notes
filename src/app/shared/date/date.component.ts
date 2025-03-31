import { Component, Input } from '@angular/core';
import { formatDateFromUnix } from 'src/app/services/utilities';

@Component({
  selector: 'app-date',
  templateUrl: './date.html',
  standalone: false
})
export class DateComponent {
  @Input() date?: number;
  isoDate = false;

  toggle() {
    this.isoDate = !this.isoDate;
  }
}
