import { Injectable } from '@angular/core';
import { NostrEvent } from './interfaces';
import * as sanitizeHtml from 'sanitize-html';

@Injectable({
  providedIn: 'root',
})
export class EventValidation {
  contentLimit = 280;
  tagsLimit = 10;

  sanitizeEvent(event: NostrEvent) {
    // Allow only a super restricted set of tags and attributes
    const clean = sanitizeHtml(event.content, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'img'],
      allowedAttributes: {
        a: ['href'],
        img: ['src'], // Only allow src and nothing else on images.
      },
      allowedIframeHostnames: ['www.youtube.com'],
    });

    event.content = clean;

    return event;
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

    // Reduce the content length to reduce system resource usage and improve UI experience.
    if (event.content.length > this.contentLimit) {
      event.content = event.content.substring(0, this.contentLimit);
      event.contentCut = true;
    }

    if (event.tags && event.tags.length > this.tagsLimit) {
      event.tags = event.tags.splice(0, this.tagsLimit);
      event.tagsCut = true;
    }

    return event;
  }
}
