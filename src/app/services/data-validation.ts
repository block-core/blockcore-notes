import { Injectable } from '@angular/core';
import { NostrEvent, NostrProfile } from './interfaces';
import * as sanitizeHtml from 'sanitize-html';
import { OptionsService } from './options';

@Injectable({
  providedIn: 'root',
})
export class DataValidation {
  contentLimit = 16384;
  tagsLimit = 50;

  profileLimit = 16384; // Should we consider 32768 for profiles?
  profileTagsLimit = 1000;

  contactsContentLimit = 16384;

  constructor(private options: OptionsService) {}

  sanitizeEvent(event: NostrEvent) {
    // Allow only a super restricted set of tags and attributes
    let clean = sanitizeHtml(event.content, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'img'],
      allowedAttributes: {
        a: ['href'],
        img: ['src'], // Only allow src and nothing else on images.
      },
      allowedIframeHostnames: ['www.youtube.com'],
    });

    // Some JSON content returned have new lines that breaks parsing.
    // clean = this.escapeNewLineChars(clean);

    // This escapes any linebreaks that might happen to be within the .content or elsewhere, ensuring that the content will parse to JSON.
    // clean = clean.replace('\\r', '\\\\r').replace('\\n', '\\\\n');

    event.content = clean;

    return event;
  }

  filterEvent(event: NostrEvent) {
    if (this.options.values.hideInvoice) {
      if (event.content.indexOf('lnbc') > -1) {
        return null;
      }
    }

    if (this.options.values.hideSpam) {
      // If the first 200 characters does not contain a space, just filter it out.
      if (event.content.substring(0, 200).indexOf(' ') == -1) {
        return null;
      }
    }

    return event;
  }

  filterEvents(events: NostrEvent[]) {
    return events.filter((e) => {
      return this.filterEvent(e);
    });
  }

  /** Returns true if valid, false if not valid. Does not throw error for optimization purposes. */
  validateEvent(event: NostrEvent) {
    if (event.pubkey.length < 60 || event.pubkey.length > 70) {
      return null;
    }

    if (!event.sig || !event.id) {
      return null;
    }

    if (event.sig.length < 100 || event.pubkey.length > 150) {
      return null;
    }

    if (event.id.length !== 64) {
      return null;
    }

    if (typeof event.kind !== 'number' || typeof event.created_at !== 'number') {
      return null;
    }

    if (event.kind === 0) {
      // Reduce the content length to reduce system resource usage and improve UI experience.
      if (event.content.length > this.profileLimit) {
        event.content = event.content.substring(0, this.profileLimit);
        event.contentCut = true;
      }
    } else {
      // Reduce the content length to reduce system resource usage and improve UI experience.
      if (event.content.length > this.contentLimit) {
        event.content = event.content.substring(0, this.contentLimit);
        event.contentCut = true;
      }
    }

    // TODO: Do we need more validation for tags? Probably limited length?
    // Tag content is currently not sanitized, does it need to be? Probably does since hashtags will be linkable?
    if (event.tags && event.tags.length > this.tagsLimit) {
      event.tags = event.tags.splice(0, this.tagsLimit);
      event.tagsCut = true;
    }

    return event;
  }

  /** Returns true if valid, false if not valid. Does not throw error for optimization purposes. */
  validateContacts(event: NostrEvent) {
    if (event.pubkey.length < 60 || event.pubkey.length > 70) {
      return null;
    }

    if (!event.sig || !event.id) {
      return null;
    }

    if (event.sig.length < 100 || event.pubkey.length > 150) {
      return null;
    }

    if (event.id.length !== 64) {
      return null;
    }

    if (typeof event.kind !== 'number' || typeof event.created_at !== 'number') {
      return null;
    }

    if (event.kind !== 3) {
      return null;
    }

    // Reduce the content length to reduce system resource usage and improve UI experience.
    if (event.content.length > this.contactsContentLimit) {
      event.content = event.content.substring(0, this.contactsContentLimit);
      event.contentCut = true;
    }

    return event;
  }

  escapeNewLineChars(valueToEscape: string) {
    if (valueToEscape != null && valueToEscape != '') {
      return valueToEscape.replace(/\n/g, ' ');
    } else {
      return valueToEscape;
    }
  }

  sanitizeProfile(profile: NostrProfile) {
    let clean = sanitizeHtml(profile.about, {
      allowedTags: [],
      allowedAttributes: {},
    });

    profile.about = clean;

    return profile;
  }

  /** Returns true if valid, false if not valid. Does not throw error for optimization purposes. */
  validateProfile(profile: NostrProfile) {
    if (profile.picture.length > 2000) {
      return null;
    }

    if (profile.name.length > 280) {
      return null;
    }

    if (profile.about.length > 280) {
      return null;
    }

    if (profile.nip05.length > 2000) {
      return null;
    }

    return profile;
  }
}
