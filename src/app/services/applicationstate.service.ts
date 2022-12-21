import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApplicationState {
  title = 'Blockcore Notes';

  goBack = false;

  showBackButton = false;
}
