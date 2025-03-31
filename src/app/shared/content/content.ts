import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content';
import { DataValidation } from '../../services/data-validation';
import { RouterModule } from '@angular/router';
import { ContentPhotosComponent } from '../content-photos/content-photos';
import { ContentMusicComponent } from '../content-music/content-music';
import { ContentPodcastComponent } from '../content-podcast/content-podcast';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-content',
    templateUrl: './content.html',
    styleUrls: ['./content.css'],
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      ContentPhotosComponent,
      ContentMusicComponent,
      ContentPodcastComponent,
      MatButtonModule
    ]
})
export class ContentComponent {
  @Input() content?: string;
  @Input() tags?: string[][];
  
  constructor(
    private contentService: ContentService,
    private validator: DataValidation
  ) {}
  
  // Content processing methods
}
