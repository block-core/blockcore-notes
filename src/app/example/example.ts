import { Component, OnInit } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';

@Component({
  selector: 'app-example',
  templateUrl: 'example.html',
})
export class ExampleComponent implements OnInit {
  constructor(private appState: ApplicationState) {}

  ngOnInit() {
    this.appState.updateTitle('Example');
  }
}
