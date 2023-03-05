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
  @Input() badge?: BadgeDefinitionEvent | NostrBadgeDefinition | any;
  @Input() preview: boolean = false;

  constructor(private utilities: Utilities, private badgeService: BadgeService) {}

  ngOnInit() {
    // If there are no slug, we must parse the badge event.
    if (!this.badge?.slug && this.badge.tags) {
      this.badge = this.badgeService.denormalizeBadge(this.badge as any);
    }
  }

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
