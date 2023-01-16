import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrEventDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { ProfileImageDialog } from '../profile-image-dialog/profile-image-dialog';

@Component({
  selector: 'app-content-photos',
  templateUrl: './content-photos.html',
  styleUrls: ['./content-photos.css'],
})
export class ContentPhotosComponent {
  // @Input() event?: NostrEventDocument;
  @Input() events?: NostrEventDocument[];
  @Input() displayRepliesTo: boolean = true;

  profileName = '';
  tooltip = '';

  profiles: NostrProfileDocument[] = [];
  content?: string;

  images: SafeResourceUrl[] = [];
  images2: string[] = [];
  videos: SafeResourceUrl[] = [];

  static regexpImage = /(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/g;
  // static regexpThisIsTheWay = /(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif))/gsim;
  static regexpVideo = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/gim;
  static regexpThisIsTheWay = /(?:thisistheway.gif)/g;
  // static regexpWords = /\b(?:\w|-)+\b/g;

  // static regexpVideo = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/g;

  images3 = [
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
  ];

  constructor(private profileService: ProfileService, private utilities: Utilities, public dialog: MatDialog) {}

  async ngOnInit() {
    this.images = [];

    if (!this.events) {
      return;
    }

    // let content = this.event.content;
    // this.content = content;

    // TODO: This is a very hacky way of doing this, it's just a quick prototype to demonstrate.
    // TODO: Replace using regular expressions.
    // if (content.indexOf('#[') > -1) {
    //   let startIndex = content.indexOf('#[');
    //   let endIndex = content.indexOf(']', startIndex);

    //   const profileIndex = content.substring(startIndex + 2, endIndex);
    //   const profileIndexNumber = parseInt(profileIndex);

    //   let publicKey = this.replyTo(this.event, profileIndexNumber);

    //   if (!publicKey) {
    //     return;
    //   }

    //   const profile = await this.profileService.getLocalProfile(publicKey);

    //   if (!profile) {
    //     return;
    //   }

    //   content = content.substring(0, content.indexOf('#[')) + '@' + profile?.name + content.substring(endIndex + 1);
    // }

    if (this.events.length == 0) {
      return;
    }

    const isFollowing = this.profileService.isFollowing(this.events[0].pubkey);

    if (isFollowing) {
      const images = this.events.flatMap((e) => {
        // TODO: What about sanitasation
        const images = [...e.content.matchAll(ContentPhotosComponent.regexpImage)];
        return images.map((i) => i[0]);

        // this.utilities.sanitizeUrl(e.contenti[0])

        // thumbnail: this.utilities.sanitizeUrl(e.contenti[0]),
        // original: i[0];
      });

      this.images2 = [...images, ...this.images3];

      console.log(this.images2);

      // const images = [...content.matchAll(ContentPhotosComponent.regexpImage)];
      // this.images = images.map((i) => this.utilities.sanitizeUrl(i[0]));
      // this.images2 = images.map((i) => i[0]);

      // const thisisthewayMatch = [...content.matchAll(ContentPhotosComponent.regexpThisIsTheWay)];
      // const thisistheway = thisisthewayMatch.map((i) => this.utilities.sanitizeUrl(`https://i.ytimg.com/vi/LaiN63o_BxA/maxresdefault.jpg`));
      // this.images.push(...thisistheway);

      // const videos = [...content.matchAll(ContentPhotosComponent.regexpVideo)];
      // this.videos = videos.map((i) => this.utilities.sanitizeUrl(`https://www.youtube.com/embed/${i[1]}`));

      // // Remove the image links from the text.
      // content = content.replaceAll(ContentPhotosComponent.regexpImage, '');
      // content = content.replaceAll(ContentPhotosComponent.regexpVideo, '');
      // content = content.replaceAll(ContentPhotosComponent.regexpThisIsTheWay, '');
    }

    // this.content = content;
  }

  expandImage(imagePath: SafeResourceUrl) {
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
