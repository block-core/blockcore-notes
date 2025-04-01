import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationState } from 'src/app/services/applicationstate';
import { MatBadgeModule } from '@angular/material/badge';
import { UIService } from 'src/app/services/ui';

@Component({
  selector: 'app-mobile-menu',
  templateUrl: './mobile-menu.html',
  styleUrls: ['./mobile-menu.css'],
  imports: [MatToolbarModule, MatBadgeModule, TranslateModule, RouterModule, MatButtonModule, MatIconModule, CommonModule, MatSliderModule, FormsModule],
})
export class MobileMenuComponent {
  @Input() miniplayer = false;

  appState = inject(ApplicationState);
  ui = inject(UIService);

  constructor() {}

}
