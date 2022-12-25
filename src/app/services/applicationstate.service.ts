import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Action } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class ApplicationState {
  title = 'Blockcore Notes';

  goBack = false;

  showBackButton = false;

  actions: Action[] = [];
}
