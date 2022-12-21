import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit } from 'nostr-tools';
import * as moment from 'moment';
import { EventValidation } from '../services/eventvalidation.service';
import { NostrEvent } from '../services/interfaces';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  constructor(public appState: ApplicationState, private validator: EventValidation, private utilities: Utilities, private router: Router) {}

  async ngOnInit() {}
}
