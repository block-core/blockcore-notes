import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from 'src/app/services/content';
import { EventService } from 'src/app/services/event';
import { MediaService } from 'src/app/services/media';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrEventDocument, NostrProfile, NostrProfileDocument, TokenKeyword } from '../../services/interfaces';
import { ProfileImageDialog } from '../profile-image-dialog/profile-image-dialog';

interface MediaItem {
  url: SafeResourceUrl;
  originalUrl: string;
}

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
  videos: MediaItem[] = [];
  youtube: MediaItem[] = [];
  spotify: SafeResourceUrl[] = [];
  tidal: SafeResourceUrl[] = [];

  // static regexpVideo = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/g;

  constructor(
    private eventService: EventService,
    private contentService: ContentService,
    private mediaService: MediaService,
    public optionsService: OptionsService,
    private profileService: ProfileService,
    private utilities: Utilities,
    public dialog: MatDialog
  ) {}

  enque(url: string, type: any) {
    this.mediaService.enque({ artist: '', artwork: '/assets/logos/youtube.png', title: url, source: url, type: type });
  }

  isString(token: any) {
    return typeof token === 'string';
  }

  isNewline(token: string | TokenKeyword) {
    return (token as TokenKeyword).token == 'newline';
  }

  getTooltip(token: string | TokenKeyword) {
    const tooltip = (token as TokenKeyword).tooltip;

    if (!tooltip) {
      return '';
    } else {
      return tooltip;
    }
  }

  getWord(token: string | TokenKeyword) {
    return (token as TokenKeyword).word;
  }

  async ngOnInit() {
    this.images = [];

    if (!this.event) {
      return;
    }

    let content = this.event.content;
    this.content = content;

    this.dynamicText = this.toDynamicText(this.event);

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

    //   const profile = this.profileService.getCachedProfile(publicKey);

    //   if (!profile) {
    //     return;
    //   }

    //   content = content.substring(0, content.indexOf('#[')) + '@' + profile?.name + content.substring(endIndex + 1);
    // }

    const isFollowing = this.profileService.isFollowing(this.event.pubkey);

    if (isFollowing) {
      const images = [...content.matchAll(this.contentService.regexpImage)];
      this.images = images.map((i) => this.utilities.sanitizeUrlAndBypass(i[0]));

      const videos = [...content.matchAll(this.contentService.regexpVideo)];
      this.videos = videos.map((i) => {
        return { url: this.utilities.sanitizeUrlAndBypass(i[0]), originalUrl: i[0] };
      });

      const thisisthewayMatch = [...content.matchAll(this.contentService.regexpThisIsTheWay)];
      const thisistheway = thisisthewayMatch.map((i) => this.utilities.bypassUrl(`https://i.ytimg.com/vi/LaiN63o_BxA/maxresdefault.jpg`));
      this.images.push(...thisistheway);

      const alwaysHasBeenMatch = [...content.matchAll(this.contentService.regexpAlwaysHasBeen)];
      const alwayshasbeen = alwaysHasBeenMatch.map((i) => this.utilities.bypassUrl(`https://imgflip.com/s/meme/Always-Has-Been.png`));
      this.images.push(...alwayshasbeen);

      const youtubes = [...content.matchAll(this.contentService.regexpYouTube)];
      this.youtube = youtubes.map((i) => {
        return { url: this.utilities.bypassFrameUrl(`https://www.youtube.com/embed/${i[1]}`), originalUrl: `https://www.youtube.com/embed/${i[1]}` };
      });

      // const spotify = [...content.matchAll(ContentComponent.regexpSpotify)];
      // this.spotify = spotify.map((i) => this.utilities.sanitizeUrlAndBypassFrame(i[0].replace('open.spotify.com/', 'open.spotify.com/embed/')));

      // Remove the image links from the text.
      content = content.replaceAll(this.contentService.regexpImage, '');
      content = content.replaceAll(this.contentService.regexpYouTube, '');
      content = content.replaceAll(this.contentService.regexpVideo, '');
      // content = content.replaceAll(ContentComponent.regexpThisIsTheWay, '');

      if (this.optionsService.values.enableTidal) {
        // After doing image, video and known memes, get all URLs and handle Tidal.
        const urls = [...content.matchAll(this.contentService.regexpUrl)];
        const tidalUrl = urls.filter((url) => url[0].indexOf('tidal.com') > -1);
        this.tidal = tidalUrl.map((i) => this.utilities.sanitizeUrlAndBypassFrame(i[0].replace('tidal.com/track', 'embed.tidal.com/tracks')));

        for (let index = 0; index < tidalUrl.length; index++) {
          content = content.replace(tidalUrl[index][0], '');
        }
      }

      if (this.optionsService.values.enableSpotify) {
        // After doing image, video and known memes, get all URLs and handle Spotify.
        const urls = [...content.matchAll(this.contentService.regexpUrl)];
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

  expandImageUrl(imagePath: string) {
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

  getDisplayName(pubkey: string) {
    const profile = this.profileService.getCachedProfile(pubkey);

    if (!profile) {
      return this.utilities.getShortenedIdentifier(pubkey);
    } else {
      return this.utilities.getProfileDisplayName(profile);
    }
  }

  replyTo(event: NostrEventDocument, index: number) {
    if (!event) {
      return;
    }

    let tags = event.tags[index]; //.filter((t) => t[0] === 'p').map((t) => t[1]);
    // tags = tags.filter((t) => t !== event.pubkey);

    return tags[1];
  }

  dynamicText: (string | TokenKeyword | any)[] = [];

  //Replace keywords with keyword objects
  toDynamicText(event: NostrEventDocument): (string | TokenKeyword)[] {
    let text = event.content;

    const res: (string | TokenKeyword)[] = [];
    const lines = text.split(/\r?\n/);
    const tokens = [];

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      //let lineTokens = line.split(/\s+/);
      let lineTokens = line.split(/(\s|'s|,)/g);

      lineTokens = lineTokens.filter((entry) => entry != '');
      lineTokens.push('<br>');
      tokens.push(...lineTokens);
    }

    let i = 0;
    for (const token of tokens) {
      let keyword = this.contentService.keywords[token.toLowerCase()];
      if (keyword) {
        if (keyword.token == 'username') {
          let index = Number(token.replace('#[', '').replace(']', ''));
          let tags = this.eventService.getPublicKeyAndEventTags(event.tags);

          if (tags.length > index) {
            keyword.word = tags[index][1];
          } else {
            // If we cannot find the pubkey..
            keyword.word = token;
            debugger;
          }
        }

        i = res.push(keyword);
      } else if (token.startsWith('http://') || token.startsWith('https://')) {
        i = res.push({ word: token, token: 'link' });
      } else {
        if (!res[i]) res[i] = token;
        else res[i] += ' ' + token;
      }
    }
    return res;
  }
}
