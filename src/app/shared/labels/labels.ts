import { Component, EventEmitter, Output } from '@angular/core';
import { MatChipListboxChange } from '@angular/material/chips';
import { LabelService } from 'src/app/services/label';
import {MatChipsModule} from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-labels',
  templateUrl: 'labels.html',
  styleUrls: ['labels.css'],
  imports: [MatChipsModule, MatFormFieldModule, MatInputModule, MatIcon, FormsModule, CommonModule],
})
export class LabelsComponent {
  showNewLabel?: boolean;
  label?: string;
  @Output() selectionChanged = new EventEmitter<string[]>();

  constructor(public labelService: LabelService) {}

  addNewLabel() {
    this.showNewLabel = true;
  }

  hideNewLabel() {
    this.showNewLabel = false;
    this.label = '';
  }

  onChange(event: MatChipListboxChange) {
    console.log(event);
    this.selectionChanged.emit(event.value);
  }

  async saveLabel() {
    if (!this.label) {
      return;
    }

    this.labelService.saveLabel(this.label);

    this.label = '';
    this.showNewLabel = false;
  }
}
