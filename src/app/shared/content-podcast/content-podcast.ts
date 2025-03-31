import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SafeResourceUrl } from '@angular/platform-browser';
import { MediaService } from 'src/app/services/media';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrEventDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { ProfileImageDialog } from '../profile-image-dialog/profile-image-dialog';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-content-podcast',
    templateUrl: './content-podcast.html',
    styleUrls: ['./content-podcast.css'],
    standalone: true,
    imports: [CommonModule, MatDialogModule]
})
export class ContentPodcastComponent {
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
  static regexpVideo = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/gim;
  static regexpThisIsTheWay = /(?:thisistheway.gif)/g;

  constructor(private media: MediaService, private options: OptionsService, private profileService: ProfileService, private utilities: Utilities, public dialog: MatDialog) {}

  toggleMediaPlayer() {
    this.options.values.showMediaPlayer = !this.options.values.showMediaPlayer;
  }

  play(title: string, artist: string, file: string, artwork: string) {
    this.media.play({
      title: title,
      artist: artist,
      source: file,
      artwork: artwork,
      type: 'Podcast',
    });
  }

  queue(title: string, artist: string, file: string, artwork: string) {
    this.media.enque({
      title: title,
      artist: artist,
      source: file,
      artwork: artwork,
      type: 'Podcast',
    });
  }

  mediaConnect() {
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
      try {
        await audio.play();
      } catch (err: any) {
        console.error(err.name, err.message);
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
    });

    audio.addEventListener('play', () => {
      navigator.mediaSession.playbackState = 'playing';
    });

    audio.addEventListener('pause', () => {
      navigator.mediaSession.playbackState = 'paused';
    });
  }

  async ngOnInit() {
    this.images = [];

    if (!this.events) {
      return;
    }

    if (this.events.length == 0) {
      return;
    }
  }

  expandImage(imagePath: SafeResourceUrl) {
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

    return tags;
  }

  replyTo(event: NostrEventDocument, index: number) {
    if (!event) {
      return;
    }

    let tags = event.tags[index];

    return tags[1];
  }
}
