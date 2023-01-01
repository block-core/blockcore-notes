import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { DataValidation } from '../services/data-validation.service';
import { Circle, NostrEvent, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { StorageService } from '../services/storage.service';
import { CirclesService } from '../services/circles.service';
import { CircleDialog } from '../shared/create-circle-dialog/create-circle-dialog';
import { MatDialog } from '@angular/material/dialog';
import { v4 as uuidv4 } from 'uuid';
import { ImportFollowDialog, ImportFollowDialogData } from './import-follow-dialog/import-follow-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../services/authentication.service';
import { FeedService } from '../services/feed.service';
import { copyToClipboard } from '../shared/utilities';

@Component({
  selector: 'app-circles',
  templateUrl: './circles.component.html',
  styleUrls: ['./circles.component.css'],
})
export class CirclesComponent {
  publicKey?: string | null;
  loading = false;
  searchTerm: any;
  constructor(
    public appState: ApplicationState,
    private circlesService: CirclesService,
    private storage: StorageService,
    private profile: ProfileService,
    public dialog: MatDialog,
    private feedService: FeedService,
    private validator: DataValidation,
    private utilities: Utilities,
    private authService: AuthenticationService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnDestroy() {
    // if (this.sub) {
    //   this.sub.unsub();
    // }
  }

  circles: Circle[] = [];

  async load() {
    this.loading = true;
    this.circles = await this.circlesService.list();
    this.following = await this.profile.followList();
    this.loading = false;
  }

  async deleteCircle(id: string) {
    await this.circlesService.deleteCircle(id);
    await this.load();
  }

  countMembers(circle: Circle) {
    return this.getFollowingInCircle(circle).length;
  }

  async importFollowList() {
    const dialogRef = this.dialog.open(ImportFollowDialog, {
      data: { pubkey: this.appState.getPublicKey() },
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result: ImportFollowDialogData) => {
      if (!result) {
        return;
      }

      this.snackBar.open('Importing followers process has started', 'Hide', {
        duration: 2500,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      let pubkey = this.utilities.ensureHexIdentifier(result.pubkey);

      console.log('GET FOLLOWING LIST FOR:', pubkey);

      // TODO: Add ability to slowly query one after one relay, we don't want to receive multiple
      // follow lists and having to process everything multiple times. Just query one by one until
      // we find the list. Until then, we simply grab the first relay only.
      this.feedService.downloadContacts(pubkey).subscribe(async (contacts) => {
        console.log('DOWNLOAD COMPLETE!', contacts);

        const publicKeys = contacts.tags.map((t) => t[1]);

        for (let i = 0; i < publicKeys.length; i++) {
          const publicKey = publicKeys[i];
          const profile = await this.profile.getProfile(publicKey);

          // If the user already exists in our database of profiles, make sure we keep their previous circle (if unfollowed before).
          if (profile) {
            await this.profile.follow(publicKeys[i], profile.circle);
          } else {
            await this.profile.follow(publicKeys[i]);
          }
        }

        await this.load();

        this.ngZone.run(() => {
          this.cd.detectChanges();
        });
      });

      // if (pubkey.startsWith('npub')) {
      //   pubkey = this.utilities.arrayToHex(this.utilities.convertFromBech32(pubkey));
      // }

      // await this.profileService.follow(pubkey);
      // await this.feedService.downloadRecent([pubkey]);
    });
  }

  copy(text: string) {
    copyToClipboard(text);

    this.snackBar.open('Copied to clipboard', 'Hide', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  getFollowingInCircle(circle: Circle) {
    if (circle.id == null || circle.id == '') {
      return this.following.filter((f) => f.circle == null);
    } else {
      return this.following.filter((f) => f.circle == circle.id);
    }
  }

  copyPubKeys(circle: Circle) {
    let pubkeys = this.getPublicKeys(circle);
    pubkeys = pubkeys.map((k) => this.utilities.getNostrIdentifier(k));
    this.copy(JSON.stringify(pubkeys));
  }

  copyPubKeysHex(circle: Circle) {
    const pubkeys = this.getPublicKeys(circle);
    this.copy(JSON.stringify(pubkeys));
  }

  private getPublicKeys(circle: Circle) {
    const profiles = this.getFollowingInCircle(circle);
    const pubkeys = profiles.map((p) => p.pubkey);
    return pubkeys;
  }

  getNpub(hex: string) {
    return this.utilities.getNostrIdentifier(hex);
  }

  publishFollowList() {}

  createCircle(): void {
    const dialogRef = this.dialog.open(CircleDialog, {
      data: { name: '', style: '1', public: true },
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }

      this.circlesService.putCircle({
        id: uuidv4(),
        ...result,
      });

      await this.load();
    });
  }

  following: NostrProfileDocument[] = [];

  async ngOnInit() {
    this.appState.title = 'Circles';
    this.appState.showBackButton = true;
    this.appState.actions = [
      {
        icon: 'add_circle',
        tooltip: 'Create Circle',
        click: () => {
          this.createCircle();
        },
      },
    ];

    await this.load();

    // if (this.relay) {
    //   return;
    // }
    // // const relay = relayInit('wss://relay.nostr.info');
    // this.relay = relayInit('wss://relay.damus.io');
    // this.relay.on('connect', () => {
    //   console.log(`connected to ${this.relay.url}`);
    //   this.onConnected(this.relay);
    // });
    // this.relay.on('disconnect', () => {
    //   console.log(`DISCONNECTED! ${this.relay.url}`);
    // });
    // this.relay.on('notice', () => {
    //   console.log(`NOTICE FROM ${this.relay.url}`);
    // });
    // this.relay.connect();
    // sub.on('eose', () => {
    //   sub.unsub();
    // });
  }

  // about
  // display_name
  // name
  // pubkey
  // async search() {
  //   const text: string = this.searchTerm;

  //   if (text == 'undefined' || text == null || text == '') {
  //     this.loading = true;
  //     this.profiles = await this.profile.followList();
  //     this.loading = false;
  //   } else {
  //     this.loading = true;
  //     const allprofiles = await this.profile.followList();
  //     this.profiles = allprofiles.filter((item: any) => item.name === text || item.display_name === text || item.about === text || item.pubkey === text);
  //     this.loading = false;
  //   }
  // }
}
