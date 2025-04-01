import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AgoPipe } from '../ago.pipe';

@Component({
  selector: 'app-date',
  templateUrl: 'date.html',
  styleUrls: ['date.css'],
  imports: [CommonModule, AgoPipe],
})
export class DateComponent {
  @Input() date!: number;
  isoDate?: boolean;
  toggle() {
    this.isoDate = !this.isoDate;
  }
}
