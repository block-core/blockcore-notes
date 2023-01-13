import { Injectable } from '@angular/core';
import { QueryJob } from './interfaces';
@Injectable({
  providedIn: 'root',
})
export class QueueService {
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
