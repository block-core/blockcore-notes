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

  enqueProfile(identifier: string) {
    this.queues.profile.jobs.push({ identifier: identifier, type: 'Profile' });
    this.trigger();
  }

  enqueEvent(identifier: string) {
    this.queues.event.jobs.push({ identifier: identifier, type: 'Event' });
    this.trigger();
  }

  enqueContacts(identifier: string) {
    this.queues.contacts.jobs.push({ identifier: identifier, type: 'Contacts' });
    this.trigger();
  }

  enque(identifier: string, type: 'Profile' | 'Event' | 'Contacts') {
    if (type === 'Profile') {
      this.enqueProfile(identifier);
    } else if (type === 'Event') {
      this.enqueEvent(identifier);
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
