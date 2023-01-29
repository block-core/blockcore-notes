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

  enqueProfile(identifier: string, callback?: any) {
    this.queues.profile.jobs.push({ identifier: identifier, type: 'Profile', callback: callback });
    this.trigger();
  }

  enqueEvent(identifier: string, callback?: any, limit?: number) {
    this.queues.event.jobs.push({ identifier: identifier, type: 'Event', callback: callback, limit: limit });
    this.trigger();
  }

  enqueContacts(identifier: string, callback?: any) {
    this.queues.contacts.jobs.push({ identifier: identifier, type: 'Contacts', callback: callback });
    this.trigger();
  }

  enque(identifier: string, type: 'Profile' | 'Event' | 'Contacts', limit?: number) {
    if (type === 'Profile') {
      this.enqueProfile(identifier);
    } else if (type === 'Event') {
      this.enqueEvent(identifier, undefined, limit);
    } else if (type === 'Contacts') {
      this.enqueContacts(identifier);
    }
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
