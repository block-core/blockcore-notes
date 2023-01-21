import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SafeResourceUrl } from '@angular/platform-browser';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrEventDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { ProfileImageDialog } from '../profile-image-dialog/profile-image-dialog';

@Component({
  selector: 'app-content-music',
  templateUrl: './content-music.html',
  styleUrls: ['./content-music.css'],
})
export class ContentMusicComponent {
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

  constructor(private options: OptionsService, private profileService: ProfileService, private utilities: Utilities, public dialog: MatDialog) {}

  toggleMediaPlayer() {
    this.options.values.showMediaPlayer = !this.options.values.showMediaPlayer;
  }

  mediaConnect() {
    // new Audio('https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=lifelike-126735.mp3').play();
    const audio = document.querySelector('audio');

    if (!audio) {
      console.log('Unable to find audio element');
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'LifeLike',
      artist: 'AlexiAction',
      album: 'Blockcore Notes',
      artwork: [
        { src: 'https://cdn.pixabay.com/user/2022/04/24/14-49-29-962_250x250.jpg', sizes: '96x96', type: 'image/jpg' },
        { src: 'https://cdn.pixabay.com/user/2022/04/24/14-49-29-962_250x250.jpg', sizes: '128x128', type: 'image/jpg' },
        { src: 'https://cdn.pixabay.com/user/2022/04/24/14-49-29-962_250x250.jpg', sizes: '192x192', type: 'image/jpg' },
        { src: 'https://cdn.pixabay.com/user/2022/04/24/14-49-29-962_250x250.jpg', sizes: '256x256', type: 'image/jpg' },
        { src: 'https://cdn.pixabay.com/user/2022/04/24/14-49-29-962_250x250.jpg', sizes: '384x384', type: 'image/jpg' },
        { src: 'https://cdn.pixabay.com/user/2022/04/24/14-49-29-962_250x250.jpg', sizes: '512x512', type: 'image/jpg' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', async () => {
      // Resume playback
      try {
        await audio.play();
      } catch (err: any) {
        console.error(err.name, err.message);
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      // Pause active playback
      audio.pause();
    });

    audio.addEventListener('play', () => {
      navigator.mediaSession.playbackState = 'playing';
    });

    audio.addEventListener('pause', () => {
      navigator.mediaSession.playbackState = 'paused';
    });

    // navigator.mediaSession.setActionHandler('play', () => { /* Code excerpted. */ });
    // navigator.mediaSession.setActionHandler('pause', () => { /* Code excerpted. */ });
    // navigator.mediaSession.setActionHandler('stop', () => { /* Code excerpted. */ });
    // navigator.mediaSession.setActionHandler('seekbackward', () => { /* Code excerpted. */ });
    // navigator.mediaSession.setActionHandler('seekforward', () => { /* Code excerpted. */ });
    // navigator.mediaSession.setActionHandler('seekto', () => { /* Code excerpted. */ });
    // navigator.mediaSession.setActionHandler('previoustrack', () => { /* Code excerpted. */ });
    // navigator.mediaSession.setActionHandler('nexttrack', () => { /* Code excerpted. */ });
    // navigator.mediaSession.setActionHandler('skipad', () => { /* Code excerpted. */ });
  }

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
