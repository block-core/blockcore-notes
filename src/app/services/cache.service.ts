import { Observable, Subject, of, tap, throwError } from 'rxjs';

interface CacheContent {
  expiry: number;
  value: any;
}

export class CacheService {
  private cache: Map<string, CacheContent> = new Map<string, CacheContent>();
  private inFlightObservables: Map<string, Subject<any>> = new Map<string, Subject<any>>();
  readonly DEFAULT_MAX_AGE: number = 300000;

  get(key: string, fallback?: Observable<any>, maxAge?: number): Observable<any> | Subject<any> {
    if (this.hasValidCachedValue(key)) {
      console.log(`%cGetting from cache ${key}`, 'color: green');
      return of(this.cache.get(key)!.value);
    }

    if (!maxAge) {
      maxAge = this.DEFAULT_MAX_AGE;
    }

    if (this.inFlightObservables.has(key)) {
      return this.inFlightObservables.get(key)!;
    } else if (fallback && fallback instanceof Observable) {
      this.inFlightObservables.set(key, new Subject());
      console.log(`%c Calling api for ${key}`, 'color: purple');

      return fallback.pipe(
        tap({
          next: (val) => {
            // on next 11, etc.
            // console.log('on next', val);
            this.set(key, val, maxAge);
          },
          error: (error) => {
            console.log('on error', error.message);
            this.inFlightObservables.delete(key);
            throwError(() => error);
          },
          complete: () => {},
        })
      );
    } else {
      return throwError(() => 'Requested key is not available in Cache');
    }
  }

  set(key: string, value: any, maxAge: number = this.DEFAULT_MAX_AGE): void {
    this.cache.set(key, { value: value, expiry: Date.now() + maxAge });
    this.notifyInFlightObservers(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  private notifyInFlightObservers(key: string, value: any): void {
    if (this.inFlightObservables.has(key)) {
      const inFlight = this.inFlightObservables.get(key)!;
      const observersCount = inFlight.observers.length;

      if (observersCount) {
        console.log(`%cNotifying ${inFlight.observers.length} flight subscribers for ${key}`, 'color: blue');
        inFlight.next(value);
      }

      inFlight.complete();
      this.inFlightObservables.delete(key);
    }
  }

  private hasValidCachedValue(key: string): boolean {
    if (this.cache.has(key)) {
      if (this.cache.get(key)!.expiry < Date.now()) {
        this.cache.delete(key);
        return false;
      }
      return true;
    } else {
      return false;
    }
  }
}
