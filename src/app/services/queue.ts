import { NostrRelaySubscription, QueryJob } from './interfaces';

export class Queue {
  enqueProfile(identifier: string) {
    this.queues.profile.jobs.push({ identifier: identifier, type: 'Profile' });
  }

  enqueEvent(identifier: string) {
    this.queues.event.jobs.push({ identifier: identifier, type: 'Event' });
  }

  enqueContacts(identifier: string) {
    this.queues.contacts.jobs.push({ identifier: identifier, type: 'Contacts' });
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
    subscriptions: {
      active: false,
      jobs: [] as NostrRelaySubscription[],
    },
  };
}
