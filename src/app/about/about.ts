import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApplicationState } from '../services/applicationstate';
import { AddRelayDialog, AddRelayDialogData } from '../shared/add-relay-dialog/add-relay-dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';

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
