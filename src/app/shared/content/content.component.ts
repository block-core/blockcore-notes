import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { NostrEventDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';

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

  constructor(private profileService: ProfileService, private utilities: Utilities) {}

  async ngOnInit() {
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

    this.content = content;
  }

  repliesTo(event: NostrEventDocument) {
    if (!event) {
      return;
    }

    let tags = event.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
    tags = tags.filter((t) => t !== event.pubkey);

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
