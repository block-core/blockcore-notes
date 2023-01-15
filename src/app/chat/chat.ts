import { Component, ChangeDetectorRef } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrls: ['./chat.css'],
})
export class ChatComponent {
  constructor(private appState: ApplicationState) {}

  async ngOnInit() {
    this.appState.updateTitle('Chat');
    this.appState.goBack = true;
    this.appState.actions = [];
  }
}
