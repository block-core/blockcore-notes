import { Injectable } from '@angular/core';
import { Circle, LabelModel } from './interfaces';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { StorageService } from './storage';
import { Utilities } from './utilities';
import { dexieToRx } from '../shared/utilities';

@Injectable({
  providedIn: 'root',
})
export class LabelService {
  static DEFAULT: LabelModel[] = [
    { id: 'photo', name: 'Photo' },
    { id: 'film', name: 'Film' },
    { id: 'music', name: 'Music' },
    { id: 'podcast', name: 'Podcast' },
    { id: 'inspirational', name: 'Inspirational' },
    { id: 'meme', name: 'Meme' },
  ];

  labels: LabelModel[] = [];

  constructor(private storage: StorageService) {}

  async initialize() {
    this.labels = await this.storage.storage.getLabels();

    if (this.labels.length == 0) {
      for (let index = 0; index < LabelService.DEFAULT.length; index++) {
        const label = LabelService.DEFAULT[index];
        await this.storage.storage.putLabel(label);
      }
    }
  }
}
