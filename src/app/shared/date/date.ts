import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-date',
    templateUrl: 'date.html',
    styleUrls: ['date.css'],
    standalone: false
})
export class DateComponent {
  @Input() date!: number;
  isoDate?: boolean;
  toggle() {
    this.isoDate = !this.isoDate;
  }
}
