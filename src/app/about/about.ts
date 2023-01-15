import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApplicationState } from '../services/applicationstate';
import { AddRelayDialog, AddRelayDialogData } from '../shared/add-relay-dialog/add-relay-dialog';

@Component({
  selector: 'app-about',
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
