import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, map, shareReplay, Observable } from 'rxjs';
import { Action } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class ApplicationState {
  constructor(private breakpointObserver: BreakpointObserver) {
    this.isSmallScreen$ = this.breakpointObserver.observe('(max-width: 599px)').pipe(
      map((result) => result.matches),
      shareReplay()
    );
  }

  title = 'Blockcore Notes';

  goBack = false;

  showBackButton = false;

  actions: Action[] = [];

  isSmallScreen$: Observable<boolean>;
}
