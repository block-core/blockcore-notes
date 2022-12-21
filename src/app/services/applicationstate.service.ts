import { Injectable } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApplicationState {
  title = 'Blockcore Notes';

  // authenticated = false;

  authenticated$: Subject<boolean> = new ReplaySubject();

  publicKey?: string;

  publicKeyHex?: string;

  goBack = false;

  showBackButton = false;

  short?: string;
}
