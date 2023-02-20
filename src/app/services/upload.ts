import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  static defaultService = 'nostr.build';

  constructor() {}
}
