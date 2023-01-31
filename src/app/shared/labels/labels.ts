import { Component } from '@angular/core';
import { LabelModel } from 'src/app/services/interfaces';
import { StorageService } from 'src/app/services/storage';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-labels',
  templateUrl: 'labels.html',
})
export class LabelsComponent {
  showNewLabel?: boolean;
  label?: string;
  labels: LabelModel[]=[];

  constructor(private storageService: StorageService) {}

  addNewLabel() {
    this.showNewLabel = true;
  }

  hideNewLabel() {
    this.showNewLabel = false;
    this.label = '';
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
  }

  async ngOnInit() {
    setTimeout(async () => {this.labels = await this.storageService.storage.getLabels()}, 1000);
  }
}
