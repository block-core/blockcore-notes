import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NostrEventDocument, NostrProfileDocument } from './interfaces';
import { tap, delay, timer, takeUntil, timeout, Observable, of, BehaviorSubject, map, combineLatest, single, Subject, Observer, concat, concatMap, switchMap, catchError, race } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(private router: Router) {}

  #showMore: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  showMore$ = this.#showMore.asObservable();

  showMore() {
    this.#showMore.next();
  }

  openEvent($event: any, event: NostrEventDocument) {
    const paths = $event.composedPath();

    if (!paths || paths.length == 0) {
      return;
    }

    if (paths[0].className.indexOf('clickable') == -1) {
      return;
    }

    this.router.navigate(['/e', event.id]);
  }

  openProfile($event: any, event: NostrProfileDocument) {
    const paths = $event.composedPath();

    if (!paths || paths.length == 0) {
      return;
    }

    if (paths[0].className.indexOf('clickable') == -1) {
      return;
    }

    this.router.navigate(['/p', event.pubkey]);
  }
}
