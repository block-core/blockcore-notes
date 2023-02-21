import { Injectable } from '@angular/core';
import { Circle, LabelModel } from './interfaces';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { StorageService } from './storage';
import { Utilities } from './utilities';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class LabelService {
  static DEFAULT: LabelModel[] = [
    { id: 'photo', name: 'Photo' },
    { id: 'film', name: 'Film' },
    { id: 'film-music', name: 'Music Videos' },
    { id: 'music', name: 'Music' },
    { id: 'podcast', name: 'Podcast' },
    { id: 'inspirational', name: 'Inspirational' },
    { id: 'meme', name: 'Meme' },
    { id: 'article', name: 'Article' },
  ];

  labels: LabelModel[] = [];

  constructor(private storage: StorageService) {}

  getName(id: string) {
    const label = this.labels.find((l) => l.id == id);

    if (!label) {
      return '';
    }

    return label.name;
  }

  async saveLabel(label: string) {
    if (!label) {
      return;
    }

    let entry = {
      name: label,
      id: uuidv4(),
    };

    await this.storage.storage.putLabel(entry);

    this.labels.push(entry);
    this.sort();
  }

  sort() {
    this.labels = this.labels.sort((a, b) => {
      return a.name?.toLowerCase() < b.name?.toLowerCase() ? -1 : 1;
    });
  }

  async initialize() {
    this.labels = await this.storage.storage.getLabels();

    if (this.labels.length == 0) {
      for (let index = 0; index < LabelService.DEFAULT.length; index++) {
        const label = LabelService.DEFAULT[index];
        await this.storage.storage.putLabel(label);
      }
    }

    this.sort();
  }
}
