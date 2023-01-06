import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { NostrEventDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { ProfileImageDialog } from '../profile-image-dialog/profile-image-dialog';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css'],
})
export class ContentComponent {
  @Input() event?: NostrEventDocument;

  profileName = '';
  tooltip = '';

  profiles: NostrProfileDocument[] = [];
  content?: string;

  images: string[] = [];
  static regexp = /(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif))/g;

  constructor(private profileService: ProfileService, private utilities: Utilities, public dialog: MatDialog) {}

  async ngOnInit() {
    this.images = [];

    if (!this.event) {
      return;
    }

    let content = this.event.content;
    this.content = content;

    // TODO: This is a very hacky way of doing this, it's just a quick prototype to demonstrate.
    // TODO: Replace using regular expressions.
    if (content.indexOf('#[') > -1) {
      let startIndex = content.indexOf('#[');
      let endIndex = content.indexOf(']', startIndex);

      const profileIndex = content.substring(startIndex + 2, endIndex);
      const profileIndexNumber = parseInt(profileIndex);

      let publicKey = this.replyTo(this.event, profileIndexNumber);

      if (!publicKey) {
        return;
      }

      const profile = await this.profileService.getProfile(publicKey);

      if (!profile) {
        return;
      }

      content = content.substring(0, content.indexOf('#[')) + '@' + profile?.name + content.substring(endIndex + 1);
    }

    if (this.profileService.isFollowing(this.event.pubkey)) {
      const images = [...content.matchAll(ContentComponent.regexp)];
      this.images = images.map((i) => i[0]);

      // Remove the image links from the text.
      content = content.replaceAll(ContentComponent.regexp, '');
    }

    this.content = content;
  }

  expandImage(imagePath: string) {
    this.dialog.open(ProfileImageDialog, {
      data: { picture: imagePath },
    });
  }

  // TODO: FIX THIS IMMEDIATELY FOR PERFORMANCE!
  hashtags(tags: any[]) {
    const hashtags = tags.filter((row) => row[0] === 't').map((t) => t[1]);

    if (hashtags.length == 0) {
      return null;
    }

    // console.log(hashtags.toString());

    return hashtags;
  }

  repliesTo(event: NostrEventDocument) {
    if (!event) {
      return null;
    }

    let tags = event.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
    tags = tags.filter((t) => t !== event.pubkey);

    if (tags.length == 0) {
      return null;
    }

    return tags;
  }

  replyTo(event: NostrEventDocument, index: number) {
    if (!event) {
      return;
    }

    let tags = event.tags[index]; //.filter((t) => t[0] === 'p').map((t) => t[1]);
    // tags = tags.filter((t) => t !== event.pubkey);

    return tags[1];
  }
}
