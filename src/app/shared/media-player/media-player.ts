import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MediaService } from 'src/app/services/media';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { TimePipe } from '../time.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-media-player',
    templateUrl: './media-player.html',
    styleUrls: ['./media-player.css'],
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      MatSliderModule,
      MatButtonModule,
      MatIconModule,
      TimePipe
    ]
})
export class MediaPlayerComponent implements OnInit {
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
}
