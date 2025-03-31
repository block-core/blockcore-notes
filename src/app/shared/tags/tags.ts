import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-tags',
    templateUrl: './tags.html',
    styleUrls: ['./tags.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatChipsModule,
      RouterModule
    ]
})
export class TagsComponent {
  @Input() tags: string[] = [];
  
  navigate(tag: string) {
    // Navigation logic here
  }
}
