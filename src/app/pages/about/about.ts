import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { ApplicationState } from 'src/app/services/applicationstate';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatExpansionModule],
  templateUrl: './about.html',
  styleUrls: ['./about.css'],
})
export class AboutComponent {
  constructor(private appState: ApplicationState) {}

  ngOnInit() {
    this.appState.showBackButton = true;
    this.appState.updateTitle('About');
    this.appState.actions = [];
  }
}
