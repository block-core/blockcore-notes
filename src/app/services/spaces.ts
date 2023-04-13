import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpacesService {
  constructor() {
    this.load();
  }

  spaces: any[] = [];

  load() {
    let spaces = localStorage.getItem('blockcore:notes:nostr:spaces');

    if (spaces) {
      this.spaces = JSON.parse(spaces);
    } else {
      this.spaces = [];
    }
  }
}
