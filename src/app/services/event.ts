import { Injectable } from '@angular/core';
import { Kind } from 'nostr-tools';
import { DataValidation } from './data-validation';
import { NostrEvent, NostrEventDocument } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(private validator: DataValidation) {}

  processEvent(originalEvent: NostrEvent): NostrEvent | null {
    let event;

    if (!originalEvent) {
      return null;
    }

    // Enable to debug events coming in on the network.
    // if (originalEvent.kind == Kind.Reaction) {
    //   console.log(originalEvent);
    // }

    if (originalEvent.kind == Kind.Contacts) {
      // Validate the contacts:
      event = this.validator.validateContacts(originalEvent);
    } else {
      // Validate the event:
      event = this.validator.validateEvent(originalEvent);
    }

    if (!event) {
      debugger;
      console.log('INVALID EVENT!');
      return null;
    }

    event = this.validator.sanitizeEvent(event);
    // event = this.validator.filterEvent(event);

    if (!event) {
      return null;
    }

    // TODO: Store the raw event.
    // const nostrEvent = event as NostrEventDocument;
    // nostrEvent.raw = originalEvent;
    return event;
  }

  getPublicKeyAndEventTags(tags?: string[][]) {
    if (!tags) {
      return [];
    }

    const epTags = tags.filter((t) => t[0] === 'e' || t[0] === 'p');
    return epTags;
  }

  lastETag(event: NostrEventDocument | null) {
    const tags = this.eTags(event);

    if (tags.length == 0) {
      return undefined;
    }

    return tags[tags.length - 1][1];
  }

  titleTag(event: NostrEventDocument | null) {
    const tags = this.tagsOfType(event, 'title');

    if (tags.length == 0) {
      return undefined;
    }

    return tags[tags.length - 1][1];
  }

  // lastDTag(event: NostrEventDocument | null) {
  //   const tags = this.tagsOfType(event, 'd');

  //   if (tags.length == 0) {
  //     return undefined;
  //   }

  //   return tags[tags.length - 1][1];
  // }

  firstATag(event: NostrEventDocument | null | any) {
    const tags = this.tagsOfType(event, 'a');

    if (tags.length == 0) {
      return undefined;
    }

    return tags[0][1];
  }

  firstDTag(event: NostrEventDocument | null | any) {
    const tags = this.tagsOfType(event, 'd');

    if (tags.length == 0) {
      return undefined;
    }

    return tags[0][1];
  }

  lastTagOfType(event: NostrEventDocument | null, type: string) {
    const tags = this.tagsOfType(event, type);

    if (tags.length == 0) {
      return undefined;
    }

    return tags[tags.length - 1][1];
  }

  hashTags(event: NostrEventDocument | null) {
    return this.tagsOfTypeValues(event, 't');
  }

  parseContentReturnTags(content: string) {
    // Parse the content using regular expression to get the hashtags.
    const hashTags = this.getUniqueHashtags(content);

    // Map the hashtag array to the Nostr event tag format.
    const tags = hashTags.map((tag) => {
      return ['t', tag.substring(1)];
    });

    return tags;
  }

  getUniqueHashtags(text: string) {
    const regex = /#\w+/g;
    const matches = text.match(regex);
    const uniqueHashtags = [...new Set(matches)];
    return uniqueHashtags;
  }

  tagsOfType(event: NostrEventDocument | null, type: string) {
    if (!event) {
      return [];
    }

    const tags = event.tags.filter((t) => t[0] === type);
    return tags;
  }

  tagsOfTypeValues(event: NostrEventDocument | null, type: string) {
    if (!event) {
      return [];
    }

    const tags = event.tags.filter((t) => t[0] === type);
    return tags.map((t) => t[1]);
  }

  eTags(event: NostrEventDocument | null) {
    if (!event) {
      return [];
    }

    const eTags = event.tags.filter((t) => t[0] === 'e');
    return eTags;
  }

  pTags(event: NostrEventDocument | null) {
    if (!event) {
      return [];
    }

    const eTags = event.tags.filter((t) => t[0] === 'p');
    return eTags;
  }

  parentEventId(event: NostrEventDocument | undefined) {
    if (!event) {
      return;
    }

    const eTags = event.tags.filter((t) => t[0] === 'e');

    if (eTags.length == 0) {
      return undefined;
    }

    return eTags[eTags.length - 1][1];
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
