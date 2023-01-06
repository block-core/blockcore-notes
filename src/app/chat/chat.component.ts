import { Component, ChangeDetectorRef } from '@angular/core';
import { ApplicationState } from '../services/applicationstate.service';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  constructor(private appState: ApplicationState) {}

  async ngOnInit() {
    this.appState.title = 'Chat';
    this.appState.goBack = true;
    this.appState.actions = [];
  }
}
