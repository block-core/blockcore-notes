import { Component, Input } from '@angular/core';
import { ApplicationState } from 'src/app/services/applicationstate';
import { NostrEvent } from 'src/app/services/interfaces';

@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
})
export class MessageBubbleComponent {
  @Input() message!: NostrEvent;
  @Input() cover!: string;
  me?: string;

  constructor(private appState: ApplicationState) {}

  ngOnInit() {
    this.me = this.appState.getPublicKey();
  }
}
