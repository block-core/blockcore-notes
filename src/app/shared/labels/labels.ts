import { Component, EventEmitter, Output } from '@angular/core';
import { MatChipListboxChange } from '@angular/material/chips';
import { LabelService } from 'src/app/services/label';

@Component({
  selector: 'app-labels',
  templateUrl: 'labels.html',
  styleUrls: ['labels.css'],
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
