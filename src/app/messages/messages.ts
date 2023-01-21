import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.css'],
})
export class MessagesComponent {
  constructor(private appState: ApplicationState) {}

  ngOnInit() {
    this.appState.updateTitle('Messages');
  }
}
