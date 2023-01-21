import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SafeResourceUrl } from '@angular/platform-browser';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrEventDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { ProfileImageDialog } from '../profile-image-dialog/profile-image-dialog';

@Component({
  selector: 'app-content',
  templateUrl: './content.html',
  styleUrls: ['./content.css'],
})
export class ContentComponent {
  @Input() event?: NostrEventDocument;
  @Input() displayRepliesTo: boolean = true;

  profileName = '';
  tooltip = '';

  profiles: NostrProfileDocument[] = [];
  content?: string;

  images: SafeResourceUrl[] = [];
  videos: SafeResourceUrl[] = [];
  spotify: SafeResourceUrl[] = [];

  static regexpImage = /(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gi;
  static regexpVideo = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/gim;
  static regexpThisIsTheWay = /(?:thisistheway.gif)/g;
  static regexpSpotify = /((http|https?)?(.+?\.?)(open.spotify.com)(.+?\.?)?)/gi;
  static regexpUrl = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#.]?[\w-]+)*\/?/gi;

  // static regexpVideo = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/g;

  constructor(public optionsService: OptionsService, private profileService: ProfileService, private utilities: Utilities, public dialog: MatDialog) {}

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

      const profile = await this.profileService.getLocalProfile(publicKey);

      if (!profile) {
        return;
      }

      content = content.substring(0, content.indexOf('#[')) + '@' + profile?.name + content.substring(endIndex + 1);
    }

    const isFollowing = this.profileService.isFollowing(this.event.pubkey);

    if (isFollowing) {
      const images = [...content.matchAll(ContentComponent.regexpImage)];
      this.images = images.map((i) => this.utilities.sanitizeUrlAndBypass(i[0]));

      const thisisthewayMatch = [...content.matchAll(ContentComponent.regexpThisIsTheWay)];
      const thisistheway = thisisthewayMatch.map((i) => this.utilities.bypassUrl(`https://i.ytimg.com/vi/LaiN63o_BxA/maxresdefault.jpg`));
      this.images.push(...thisistheway);

      const videos = [...content.matchAll(ContentComponent.regexpVideo)];
      this.videos = videos.map((i) => this.utilities.bypassFrameUrl(`https://www.youtube.com/embed/${i[1]}`));

      // const spotify = [...content.matchAll(ContentComponent.regexpSpotify)];
      // this.spotify = spotify.map((i) => this.utilities.sanitizeUrlAndBypassFrame(i[0].replace('open.spotify.com/', 'open.spotify.com/embed/')));

      // Remove the image links from the text.
      content = content.replaceAll(ContentComponent.regexpImage, '');
      content = content.replaceAll(ContentComponent.regexpVideo, '');
      content = content.replaceAll(ContentComponent.regexpThisIsTheWay, '');

      if (this.optionsService.values.enableSpotify) {
        // After doing image, video and known memes, get all URLs and handle spotify.
        const urls = [...content.matchAll(ContentComponent.regexpUrl)];
        const spotifyUrl = urls.filter((url) => url[0].indexOf('open.spotify.com') > -1);
        this.spotify = spotifyUrl.map((i) => this.utilities.sanitizeUrlAndBypassFrame(i[0].replace('open.spotify.com/', 'open.spotify.com/embed/')));

        for (let index = 0; index < spotifyUrl.length; index++) {
          content = content.replace(spotifyUrl[index][0], '');
        }
      }

      //content = content.replaceAll(ContentComponent.regexpUrl, '');
    }

    this.content = content;
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
