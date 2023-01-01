import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, map, shareReplay, Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { Action } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class ApplicationState {
  constructor(private breakpointObserver: BreakpointObserver, private authService: AuthenticationService) {
    this.isSmallScreen$ = this.breakpointObserver.observe('(max-width: 599px)').pipe(
      map((result) => result.matches),
      shareReplay()
    );

    this.displayLabels$ = this.breakpointObserver.observe('(max-width: 720px)').pipe(
      map((result) => result.matches),
      shareReplay()
    );
  }

  getPublicKey(): string {
    return this.authService.authInfo$.getValue().publicKeyHex!;
  }

  title = 'Blockcore Notes';

  goBack = false;

  showBackButton = false;

  actions: Action[] = [];

  isSmallScreen$: Observable<boolean>;

  displayLabels$: Observable<boolean>;
}
