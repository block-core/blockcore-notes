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

  /** Returns the root event, first looks for "root" attribute on the e tag element or picks first in array. */
  eTags(event: NostrEventDocument | null) {
    if (!event) {
      return [];
    }

    // TODO. All of this parsing of arrays is silly and could be greatly improved with some refactoring
    // whenever I have time for it.
    const eTags = event.tags.filter((t) => t[0] === 'e');
    return eTags;
  }

  /** Returns the root event, first looks for "root" attribute on the e tag element or picks first in array. */
  rootEventId(event: NostrEventDocument | null) {
    if (!event) {
      return;
    }

    // TODO. All of this parsing of arrays is silly and could be greatly improved with some refactoring
    // whenever I have time for it.
    const eTags = event.tags.filter((t) => t[0] === 'e');

    for (let i = 0; i < eTags.length; i++) {
      const tag = eTags[i];

      // If more than 4, we likely have "root" or "reply"
      if (tag.length > 3) {
        if (tag[3] == 'root') {
          return tag[1];
        }
      }
    }

    if (eTags.length == 0) {
      return null;
    }

    return eTags[0][1];
  }

  /** Returns the root event, first looks for "root" attribute on the e tag element or picks first in array. */
  replyEventId(event: NostrEventDocument | null) {
    if (!event) {
      return;
    }

    // TODO. All of this parsing of arrays is silly and could be greatly improved with some refactoring
    // whenever I have time for it.
    const eTags = event.tags.filter((t) => t[0] === 'e');

    for (let i = 0; i < eTags.length; i++) {
      const tag = eTags[i];

      // If more than 4, we likely have "root" or "reply"
      if (tag.length > 3) {
        if (tag[3] == 'reply') {
          return tag[1];
        }
      }
    }

    if (eTags.length < 2) {
      return null;
    }

    return eTags[1][1];
  }
}
