import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-date-time',
  standalone: true,
  templateUrl: './date-time.component.html',
  styleUrls: ['./date-time.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTimeComponent implements OnInit, OnDestroy {

  @Input() initialDateTime?: Date;
  @Input() dateFormat?: string = 'MM/DD/YYYY';
  @Input() minDate?: Date;
  @Input() maxDate?: Date;

  @Input() CustomLabel?: string = '';
  @Input() CustomDateLabel?: string = 'Date';
  @Input() CustomTimeLabel?: string = 'Time';
  @Input() CustomDateHint?: string = '';
  @Input() CustomHoursHint?: string = '';

  @Output() dateTimeChanged = new EventEmitter<Date | null>();

  dateTimeForm: FormGroup;

  constructor() {
    this.dateTimeForm = new FormGroup({
      dateControl: new FormControl(null),
      timeControl: new FormControl(null),
    });
  }

  private subscriptions = new Subscription();

  ngOnInit(): void {
    if (this.initialDateTime) {
      this.dateTimeForm.controls['dateControl'].setValue(this.initialDateTime);
      this.dateTimeForm.controls['timeControl'].setValue(this.initialDateTime);
    }

    this.subscriptions.add(
      this.dateTimeForm.valueChanges.subscribe((values) => {
        if (values.dateControl || values.timeControl) { // Check if at least one has a value
          this.emitCombinedDateTime(values.dateControl, values.timeControl);
        } else {
          this.dateTimeChanged.emit(null); // Optionally emit null if both are cleared
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private emitCombinedDateTime(date: Date | null, time: Date | null): void {
    let combinedDateTime: Date | null = null;
    if (date && time) {
      combinedDateTime = new Date(date);
      combinedDateTime.setHours(time.getHours());
      combinedDateTime.setMinutes(time.getMinutes());
    } else if (date) {
      combinedDateTime = date;
    }
    this.dateTimeChanged.emit(combinedDateTime);
  }
}
