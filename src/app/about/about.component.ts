import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApplicationState } from '../services/applicationstate.service';
import { AddRelayDialog, AddRelayDialogData } from '../shared/add-relay-dialog/add-relay-dialog';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent {
  constructor(private appState: ApplicationState) {}

  ngOnInit() {
    this.appState.showBackButton = true;
    this.appState.title = 'About';
    this.appState.actions = [];
  }
}
