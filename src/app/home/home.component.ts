import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(public appState: ApplicationState, private router: Router) {}

  async ngOnInit() {
    // TODO: Initialize of extension can take time, first load we wait longer to see if extension is there. After
    // initial verification that user has extension (this happens on Connect component), then we persist some state
    // and assume extension is approve (when we have pubkey available).
    if (this.appState.authenticated) {
      // this.router.navigateByUrl('/notes');
    } else {
      this.router.navigateByUrl('/connect');
    }
  }
}
