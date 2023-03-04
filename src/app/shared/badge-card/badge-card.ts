import { Component, HostListener, Output, EventEmitter, Input, ElementRef, OnInit } from '@angular/core';
import { BadgeDefinitionEvent, NostrEventDocument } from 'src/app/services/interfaces';
import { Utilities } from 'src/app/services/utilities';

@Component({
  selector: 'app-badge-card',
  templateUrl: 'badge-card.html',
  styleUrls: ['badge-card.css'],
})
export class BadgeCardComponent implements OnInit {
  @Input() badge?: BadgeDefinitionEvent;
  @Input() preview: boolean = false;

  constructor(private utilities: Utilities) {}

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
