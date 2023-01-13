import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { QueryJob } from './interfaces';
@Injectable({
  providedIn: 'root',
})
export class QueueService {
  #queuesChanged: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  get queues$(): Observable<void> {
    return this.#queuesChanged.asObservable();
  }

  trigger() {
    this.#queuesChanged.next();
  }

  queues = {
    profile: {
      active: false,
      jobs: [] as QueryJob[],
    },
    event: {
      active: false,
      jobs: [] as QueryJob[],
    },
    contacts: {
      active: false,
      jobs: [] as QueryJob[],
    },
  };
}
