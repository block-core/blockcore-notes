import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, filter } from 'rxjs';
import { ApplicationState } from './applicationstate';

@Injectable({
  providedIn: 'root',
})
export class LoadingResolverService implements Resolve<any> {
  constructor(public appState: ApplicationState, private router: Router) {}
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.appState.initialized$.pipe(filter((value) => value));
  }
}
