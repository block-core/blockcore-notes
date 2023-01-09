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

    this.visibility$ = this.visibilityChanged.asObservable();
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

  searchText?: string;

  showSearch = false;

  actions: Action[] = [];

  /** Parameters that comes from query string during activation of the extension. */
  params: any;

  isSmallScreen$: Observable<boolean>;

  displayLabels$: Observable<boolean>;

  connected$: Observable<boolean>;

  connectedChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  connected(status: boolean) {
    // if (status != this.connectedChanged.value) {
      this.connectedChanged.next(status);
    // }
  }

  visibility$: Observable<boolean>;

  visibilityChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  visibility(status: boolean) {
    this.visibilityChanged.next(status);
  }
}
