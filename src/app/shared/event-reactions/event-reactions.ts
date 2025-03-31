import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NostrEventDocument } from '../../services/interfaces';
import { ProfileService } from '../../services/profile';

@Component({
    selector: 'app-event-reactions',
    templateUrl: './event-reactions.html',
    styleUrls: ['./event-reactions.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatButtonModule,
      MatIconModule
    ]
})
export class EventReactionsComponent {
  @Input() event?: NostrEventDocument;
  
  constructor(private profileService: ProfileService) {}
  
  // Add reaction methods here
}
