import * as nostrTools from 'nostr-tools';
import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
// import { MatDialog } from '@angular/material/dialog';
// import { Kind } from 'nostr-tools';
// import { DataService } from 'src/app/services/data';
// import { EventService } from 'src/app/services/event';
// import { NostrEventDocument } from 'src/app/services/interfaces';
// import { OptionsService } from 'src/app/services/options';
// import { ProfileService } from 'src/app/services/profile';
// import { Utilities } from 'src/app/services/utilities';
import { PostDocument } from 'animiq-nip76-tools';
import { ContentComponent } from '../../shared/content/content';
import { Nip76Service } from '../nip76.service';
@Component({
  selector: 'app-nip76-content',
  templateUrl: '../../shared/content/content.html',
  styleUrls: ['../../shared/content/content.css']
})
export class Nip76ContentComponent extends ContentComponent {
    @Input() 
    post!: PostDocument;

    override async ngOnInit() {
        this.event = this.post.nostrEvent;
        if (!this.event) {
          return;
        }
    
        this.dynamicText = this.toDynamicText({
            content: this.post.content.text, 
            tags: this.post.content.tags!,
        } as any);
        this.isFollowing = true; //this.profileService.isFollowing(this.event.pubkey);
      }
}