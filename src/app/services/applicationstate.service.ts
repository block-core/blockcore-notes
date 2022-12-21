import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApplicationState {
  title = 'Blockcore Notes';

  authenticated = false;

  publicKey?: string;

  publicKeyHex?: string;

  goBack = false;

  showBackButton = false;

  short?: string;
}