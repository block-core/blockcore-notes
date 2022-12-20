import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApplicationState {
  title = 'Blockcore Notes';

  authenticated = false;

  goBack = false;

  short = 'npub...';
}
