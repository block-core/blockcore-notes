import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate.service';

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
