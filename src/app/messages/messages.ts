import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { ProfileService } from '../services/profile';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.css'],
})
export class MessagesComponent {
  constructor(private appState: ApplicationState, public profileService: ProfileService) {}

  ngOnInit() {
    this.appState.updateTitle('Messages');
  }

  displayLabels = true;

  toggleChannelSize() {
    this.displayLabels = !this.displayLabels;

    // setTimeout(() => {
    //   this.options.values.hideSideLabels = !this.displayLabels;
    //   this.options.save();
    // }, 250);

    // this._container._ngZone.onMicrotaskEmpty.subscribe(() => {
    //   this._container._updateStyles();
    //   this._container._changeDetectorRef.markForCheck();
    // });
  }
}
