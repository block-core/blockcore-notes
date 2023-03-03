import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { QueryJob } from './interfaces';
@Injectable({
  providedIn: 'root',
})
export class QueueService {
  #queuesChanged: BehaviorSubject<QueryJob | undefined> = new BehaviorSubject<QueryJob | undefined>(undefined);

  get queues$(): Observable<QueryJob | undefined> {
    return this.#queuesChanged.asObservable();
  }

  constructor() {}

  enqueProfile(identifier: string) {
    this.#queuesChanged.next({ identifier: identifier, type: 'Profile' });
  }

  enqueEvent(identifier: string) {
    this.#queuesChanged.next({ identifier: identifier, type: 'Event' });
  }

  enqueArticle(identifier: string) {
    this.#queuesChanged.next({ identifier: identifier, type: 'Article' });
  }

  enqueBadgeDefinition(identifier: string) {
    this.#queuesChanged.next({ identifier: identifier, type: 'BadgeDefinition' });
  }

  enqueContacts(identifier: string) {
    this.#queuesChanged.next({ identifier: identifier, type: 'Contacts' });
  }

  enque(identifier: string, type: 'Profile' | 'Event' | 'Contacts' | 'Article' | 'BadgeDefinition') {
    if (type === 'Profile') {
      this.enqueProfile(identifier);
    } else if (type === 'Event') {
      this.enqueEvent(identifier);
    } else if (type === 'Contacts') {
      this.enqueContacts(identifier);
    } else if (type === 'Article') {
      this.enqueArticle(identifier);
    } else if (type === 'BadgeDefinition') {
      this.enqueBadgeDefinition(identifier);
    }
  }
}
