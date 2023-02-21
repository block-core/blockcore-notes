import { Component, EventEmitter, Output } from '@angular/core';
import { MatChipListboxChange } from '@angular/material/chips';
import { LabelModel } from 'src/app/services/interfaces';
import { StorageService } from 'src/app/services/storage';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-labels',
  templateUrl: 'labels.html',
  styleUrls: ['labels.css'],
})
export class LabelsComponent {
  showNewLabel?: boolean;
  label?: string;
  labels: LabelModel[] = [];
  @Output() selectionChanged = new EventEmitter<string[]>();

  constructor(private storageService: StorageService) {}

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

    await this.storageService.storage.putLabel({
      name: this.label,
      id: uuidv4(),
    });

    this.label = '';
    this.showNewLabel = false;

    await this.load();
  }

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.labels = await this.storageService.storage.getLabels();
  }
}
