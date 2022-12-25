import { Injectable } from '@angular/core';
import { DataValidation } from './data-validation.service';
import { NostrEvent, NostrEventDocument } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(private validator: DataValidation) {}

  processEvent(originalEvent: NostrEvent): NostrEvent | null {
    // Validate the event:
    let event = this.validator.validateEvent(originalEvent);

    if (!event) {
      debugger;
      console.log('INVALID EVENT!');
      return null;
    }

    event = this.validator.sanitizeEvent(event);
    event = this.validator.filterEvent(event);

    if (!event) {
      return null;
    }

    // TODO: Store the raw event.
    // const nostrEvent = event as NostrEventDocument;
    // nostrEvent.raw = originalEvent;

    return event;
  }
}
