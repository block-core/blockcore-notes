import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, map, shareReplay, Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { Action } from './interfaces';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ApplicationState {
  constructor(private breakpointObserver: BreakpointObserver, private authService: AuthenticationService, private location: Location) {
    this.isSmallScreen$ = this.breakpointObserver.observe('(max-width: 599px)').pipe(
      map((result) => result.matches),
      shareReplay()
    );

    this.displayLabels$ = this.breakpointObserver.observe('(max-width: 720px)').pipe(
      map((result) => result.matches),
      shareReplay()
    );

    this.connected$ = this.connectedChanged.asObservable();
  }

  getPublicKey(): string {
    return this.authService.authInfo$.getValue().publicKeyHex!;
  }

  navigateBack() {
    this.location.back();
  }

  title = 'Blockcore Notes';

  goBack = false;

  showBackButton = false;

  actions: Action[] = [];

  isSmallScreen$: Observable<boolean>;

  displayLabels$: Observable<boolean>;

  connected$: Observable<boolean>;

  connectedChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  connected(status: boolean) {
    this.connectedChanged.next(status);
  }
}
