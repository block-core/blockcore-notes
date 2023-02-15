import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MediaService } from 'src/app/services/media';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { TimePipe } from '../time.pipe';

@Component({
  selector: 'app-media-player',
  templateUrl: './media-player.html',
  styleUrls: ['./media-player.css'],
})
export class MediaPlayerComponent {
  @Input() miniplayer = false;

  constructor(public options: OptionsService, public media: MediaService, private profileService: ProfileService, private utilities: Utilities, public dialog: MatDialog) {}

  ngOnInit() {
    console.log('miniplayer:', this.miniplayer);
  }

  formatLabel(value: number): string {
    return TimePipe.time(value);
  }

  expanded = false;
  maximized = false;

  minimize() {
    window.resizeTo(200, 5);
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
}
