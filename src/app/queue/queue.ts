import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApplicationState } from '../services/applicationstate';
import { ContentService } from '../services/content';
import { MediaItem } from '../services/interfaces';
import { MediaService } from '../services/media';
import { OptionsService } from '../services/options';
import { Utilities } from '../services/utilities';
import { AddMediaDialog, AddMediaDialogData } from './add-media-dialog/add-media-dialog';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MediaPlayerComponent } from '../shared/media-player/media-player';

@Component({
    selector: 'app-queue',
    templateUrl: './queue.html',
    styleUrls: ['./queue.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatListModule,
      MediaPlayerComponent
    ]
})
export class QueueComponent {
  constructor(private contentService: ContentService, public dialog: MatDialog, private appState: ApplicationState, public optionsService: OptionsService, public media: MediaService, public utilities: Utilities) {}

  ngOnInit() {
    this.appState.showBackButton = true;
    this.appState.updateTitle('Media Queue');
    this.appState.actions = [
      {
        icon: 'queue',
        tooltip: 'Add Media to Queue',
        click: () => {
          this.addQueue();
        },
      },
    ];
  }

  addQueue() {
    const dialogRef = this.dialog.open(AddMediaDialog, {
      data: {},
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result: AddMediaDialogData) => {
      if (!result || !result.url) {
        return;
      }

      if (result.url.indexOf('youtu.be') > -1 || result.url.indexOf('youtube.com') > -1) {
        const youtubes = [...result.url.matchAll(this.contentService.regexpYouTube)];
        let youtube = youtubes.map((i) => {
          return { url: `https://www.youtube.com/embed/${i[1]}` };
        });

        for (let index = 0; index < youtube.length; index++) {
          const youtubeUrl = youtube[index].url;
          this.media.enque({ artist: '', artwork: '/assets/logos/youtube.png', title: youtubeUrl, source: youtubeUrl, type: 'YouTube' });
        }
      } else if (result.url.indexOf('.mp4') > -1 || result.url.indexOf('.webm') > -1) {
        this.media.enque({ artist: '', artwork: '/assets/logos/youtube.png', title: result.url, source: result.url, type: 'Video' });
      } else {
        this.media.enque({ artist: '', artwork: '', title: result.url, source: result.url, type: 'Music' });
      }
    });
  }

  remove(item: MediaItem) {
    this.media.dequeue(item);
  }
}
