import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { nip19 } from 'nostr-tools';
import { AddressPointer } from 'nostr-tools/nip19';
import { ApplicationState } from '../services/applicationstate';
import { BadgeService } from '../services/badge';
import { NavigationService } from '../services/navigation';
import { RelayService } from '../services/relay';
import { Utilities } from '../services/utilities';

@Component({
  selector: 'app-badge',
  templateUrl: 'badge.html',
  styleUrls: ['badge.css'],
})
export class BadgeComponent implements OnInit {
  constructor(
    private relayService: RelayService,
    public badgeService: BadgeService,
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public navigation: NavigationService,
    private utilities: Utilities
  ) {}

  sub: any;

  ngOnDestroy() {
    this.relayService.unsubscribe(this.sub.id);
  }

  ngOnInit() {
    // if (this.navigation.currentEvent) {
    //   // If the event is already set, we'll use that directly and not load based upon ID.
    //   this.ui.setEvent(this.navigation.currentEvent);
    // }

    this.appState.updateTitle('Badge');
    this.appState.showBackButton = true;

    this.activatedRoute.paramMap.subscribe(async (params) => {
      const id: string | null = params.get('id');

      if (!id) {
        this.router.navigateByUrl('/');
        return;
      }

      if (id.startsWith('naddr')) {
        const result = nip19.decode(id);
        console.log(result);

        if (result.type == 'naddr') {
          const data = result.data as AddressPointer;

          if (data.kind == 30009) {
            this.router.navigate(['/b', data.pubkey, data.identifier]);
            return;
          }
        }
      }

      const pubkey = id;
      const identifier = params.get('slug');

      if (!identifier) {
        return;
      }

      console.log('pubkey', pubkey);
      console.log('identifier', identifier);

      this.sub = this.relayService.download([{ kinds: [30009], authors: [pubkey], ['#d']: [identifier] }], undefined, 'Replaceable');
      //   this.queueService.enque(this.appState.getPublicKey(), 'BadgeDefinition');

      //   // Only trigger the event event ID if it's different than the navigation ID.
      //   if (this.navigation.currentEvent?.id != id) {
      //     debugger;
      //     // this.ui.setEventId(id);
      //     // this.thread.changeSelectedEvent(id);
      //   }
    });
  }
}
