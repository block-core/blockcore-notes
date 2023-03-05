import { Component, HostListener, Output, EventEmitter, Input, ElementRef, OnInit } from '@angular/core';
import { BadgeService } from 'src/app/services/badge';
import { BadgeDefinitionEvent, NostrBadgeDefinition, NostrEventDocument } from 'src/app/services/interfaces';
import { Utilities } from 'src/app/services/utilities';

@Component({
  selector: 'app-badge-card',
  templateUrl: 'badge-card.html',
  styleUrls: ['badge-card.css'],
})
export class BadgeCardComponent implements OnInit {
  #badge: BadgeDefinitionEvent | NostrBadgeDefinition | any;
  @Input() set badge(value: BadgeDefinitionEvent | NostrBadgeDefinition | any) {
    this.#badge = value;
    this.update();
    // this.#id = value.id;
  }
  get badge() {
    return this.#badge;
  }

  #id: string | undefined = '';
  @Input() set id(value: string | undefined) {
    this.#id = value;

    if (value) {
      this.badgeService.getBadge(value).then(async (badge) => {
        if (badge != null) {
          this.#badge = badge;
          this.update();
        }
      });
    } else {
      this.#badge = undefined;
    }
  }
  get id() {
    return this.#id;
  }

  @Input() preview: boolean = false;

  constructor(private utilities: Utilities, private badgeService: BadgeService) {}

  update() {
    // If there are no slug, we must parse the badge event.
    if (!this.#badge?.slug && this.#badge.tags) {
      this.#badge = this.badgeService.denormalizeBadge(this.#badge as any);
    }
  }

  ngOnInit() {}

  imageUrl(url?: string) {
    if (!url) {
      url = this.badge?.thumb;
    }

    if (!url) {
      return undefined;
    }

    return this.utilities.sanitizeImageUrl(url);
  }

  thumbUrl(url?: string) {
    if (!url) {
      url = this.badge?.image;
    }

    if (!url) {
      return undefined;
    }

    return this.utilities.sanitizeImageUrl(url);
  }
}
