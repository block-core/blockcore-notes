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
import { nip19 } from 'nostr-tools';

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
  // @Input() event?: NostrEventDocument;

  #event?: NostrEventDocument | undefined;

  @Input() set event(value: NostrEventDocument | undefined) {
    this.#event = value;
    this.initialize();
  }
  get event(): any {
    return this.#event;
  }

  @Input() displayRepliesTo: boolean = true;

  profileName = '';
  tooltip = '';

  profiles: NostrProfileDocument[] = [];
  // content?: string;

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

  isFollowing = false;

  getWord(token: string | TokenKeyword) {
    return (token as TokenKeyword).word;
  }

  ngOnInit() {
    this.initialize();
  }

  initialize() {
    if (!this.event) {
      return;
    }

    this.dynamicText = this.toDynamicText(this.event);
    this.isFollowing = this.profileService.isFollowing(this.event.pubkey);
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

  hashtags(tags: any[]) {
    const hashtags = tags.filter((row) => row[0] === 't').map((t) => t[1]);

    if (hashtags.length == 0) {
      return null;
    }

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

    const unique = tags.filter((item, index) => tags.indexOf(item) === index);

    return unique;
  }

  getDisplayName(pubkey: string) {
    pubkey = this.utilities.ensureHexIdentifier(pubkey);
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
  imageExtensions = ['.jpg', '.jpeg', '.gif', '.png', '.webp', '.apng', '.jfif', '.svg'];
  videoExtensions = ['.mp4', '.m4v', '.m4p', '.mpg', '.mpeg', '.webm', '.avif', '.mov', '.ogv'];
  audioExtensions = ['.mp3', '.m4a', '.flac', '.ogg', '.wav'];

  isImage(url: string) {
    for (let index = 0; index < this.imageExtensions.length; index++) {
      const extension = this.imageExtensions[index];
      if (url.includes(extension)) {
        return true;
      }
    }

    return false;
  }

  isVideo(url: string) {
    for (let index = 0; index < this.videoExtensions.length; index++) {
      const extension = this.videoExtensions[index];
      if (url.includes(extension)) {
        return true;
      }
    }

    return false;
  }

  isAudio(url: string) {
    for (let index = 0; index < this.audioExtensions.length; index++) {
      const extension = this.audioExtensions[index];
      if (url.includes(extension)) {
        return true;
      }
    }

    return false;
  }

  isYouTube(url: string) {
    if (url.indexOf('https://youtu.be') > -1 || url.indexOf('https://www.youtube.com') > -1 || url.indexOf('https://youtube.com') > -1) {
      return true;
    }

    return false;
  }

  isTidal(url: string) {
    if (!this.optionsService.values.enableTidal) {
      return false;
    }

    if (url.indexOf('https://tidal.com') > -1) {
      return true;
    }

    return false;
  }

  isSpotify(url: string) {
    if (!this.optionsService.values.enableSpotify) {
      return false;
    }

    if (url.indexOf('https://open.spotify.com') > -1) {
      return true;
    }

    return false;
  }

  bigSize = false;

  //Replace keywords with keyword objects
  toDynamicText(event: NostrEventDocument): (string | TokenKeyword)[] {
    let text = event.content;

    // Replace all zero width characters.
    text = text.replaceAll(/\p{Cf}/gu, '');

    if (text.length < 9) {
      this.bigSize = true;
    } else {
      this.bigSize = false;
    }

    // var regex = /#\[(.*?)\]/g;
    // var matches = text.match(regex);
    // console.log(matches); // ["#[hello]", "#[bye]"]

    // var str = '#[hello] world #[bye]';
    // var regex = /#\[(.*?)\]/g;
    // var match;
    // while ((match = regex.exec(str))) {
    //   console.log(match[1]); // "hello", "bye"
    // }

    const res: (string | TokenKeyword)[] = [];
    const lines = text.split(/\r?\n/);
    const tokens = [];

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      //let lineTokens = line.split(/\s+/);
      let lineTokens = line.split(/(\s|,|#\[[^\]]*\])/);

      lineTokens = lineTokens.filter((entry) => entry != '');
      lineTokens.push('<br>');
      tokens.push(...lineTokens);
    }

    let i = 0;
    for (const token of tokens) {
      let keyword = this.contentService.getKeyword(token.toLowerCase());

      if (keyword) {
        if (keyword.token == 'username') {
          let index = Number(token.replace('#[', '').replace(']', ''));
          let tags = event.tags;

          if (tags.length > index) {
            keyword.word = tags[index][1];
          } else {
            // If we cannot find the pubkey..
            keyword.word = token;
            debugger;
          }
        }

        i = res.push(keyword);
      } else if (token.startsWith('nostr:')) {
        const decoded = nip19.decode(token.substring(6));
        const val = decoded.data as any;

        if (decoded.type === 'nprofile') {
          i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypass(token), word: val.pubkey, token: decoded.type });
        } else if (decoded.type === 'npub') {
          i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypass(token), word: val, token: decoded.type });
        } else if (decoded.type === 'note') {
          i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypass(token), word: val, token: decoded.type });
        } else if (decoded.type === 'nevent') {
          i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypass(token), word: val.id, token: decoded.type });
        } else {
          i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypass(token), word: token.substring(6), token: decoded.type });
        }
      } else if (token.startsWith('http://') || token.startsWith('https://')) {
        if (this.isImage(token)) {
          i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypass(token), word: token, token: 'image' });
        } else if (this.isVideo(token)) {
          i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypass(token), word: token, token: 'video' });
        } else if (this.isAudio(token)) {
          i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypass(token), word: token, token: 'audio' });
        } else if (this.isYouTube(token)) {
          const links = [...token.matchAll(this.contentService.regexpYouTube)];
          if (links.length > 0) {
            i = res.push({ safeWord: this.utilities.bypassFrameUrl(`https://www.youtube.com/embed/${links[0][1]}`), word: `https://www.youtube.com/embed/${links[0][1]}`, token: 'youtube' });
          } else {
            i = res.push({ word: token, token: 'link' });
          }
        } else if (this.isSpotify(token)) {
          i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypassFrame(token.replace('open.spotify.com/', 'open.spotify.com/embed/')), word: token, token: 'spotify' });
        } else if (this.isTidal(token)) {
          // TODO: Need to improve this, but for now we do a very basic replacement for single tracks only.
          if (token.startsWith('https://tidal.com/browse/track/')) {
            const embedUrl = token.replace('tidal.com/browse/track/', 'embed.tidal.com/tracks/');
            i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypassFrame(embedUrl), word: token, token: 'tidal' });
          } else if (token.startsWith('https://tidal.com/track/')) {
            const embedUrl = token.replace('tidal.com/track/', 'embed.tidal.com/tracks/');
            i = res.push({ safeWord: this.utilities.sanitizeUrlAndBypassFrame(embedUrl), word: token, token: 'tidal' });
          } else {
            i = res.push({ word: token, token: 'link' });
          }
        } else {
          i = res.push({ word: token, token: 'link' });
        }
      } else {
        if (!res[i]) res[i] = token;
        else res[i] += token;
      }
    }
    return res;
  }
}
