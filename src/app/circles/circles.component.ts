import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { DataValidation } from '../services/data-validation.service';
import { Circle, NostrEvent, NostrEventDocument, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { CircleService } from '../services/circle.service';
import { CircleDialog } from '../shared/create-circle-dialog/create-circle-dialog';
import { MatDialog } from '@angular/material/dialog';
import { v4 as uuidv4 } from 'uuid';
import { ImportFollowDialog, ImportFollowDialogData } from './import-follow-dialog/import-follow-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../services/authentication.service';
import { copyToClipboard } from '../shared/utilities';
import { Subscription, tap } from 'rxjs';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-circles',
  templateUrl: './circles.component.html',
  styleUrls: ['./circles.component.css'],
})
export class CirclesComponent {
  publicKey?: string | null;
  loading = false;
  following: NostrProfileDocument[] = [];
  searchTerm: any;

  items: Circle[] = [];
  items$ = this.circleService.items$.pipe(
    tap((items) => {
      this.items = items;
    })
  );

  constructor(
    public appState: ApplicationState,
    public circleService: CircleService,
    private profileService: ProfileService,
    public dialog: MatDialog,
    private validator: DataValidation,
    private utilities: Utilities,
    private authService: AuthenticationService,
    private router: Router,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  async deleteCircle(id: number) {
    const pubKeys = this.getFollowingInCircle(id).map((f) => f.pubkey);

    await this.circleService.delete(id);

    for (var i = 0; i < pubKeys.length; i++) {
      await this.profileService.setCircle(pubKeys[i], 0);
    }
  }

  countMembers(circle: Circle) {
    return this.getFollowingInCircle(circle.id).length;
  }

  subscriptions: Subscription[] = [];

  copy(text: string) {
    copyToClipboard(text);

    this.snackBar.open('Copied to clipboard', 'Hide', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  getFollowingInCircle(id?: number) {
    if (id == null) {
      return this.following.filter((f) => f.circle == null || f.circle == 0);
    } else {
      return this.following.filter((f) => f.circle == id);
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
    const profiles = this.getFollowingInCircle(circle.id);
    const pubkeys = profiles.map((p) => p.pubkey);
    return pubkeys;
  }

  private getPublicPublicKeys() {
    console.log(this.items);
    console.log(this.following);

    const items: string[] = [];

    for (let i = 0; i < this.items.length; i++) {
      const circle = this.items[i];

      if (circle.public) {
        const profiles = this.getFollowingInCircle(circle.id);
        const pubkeys = profiles.map((p) => p.pubkey);
        items.push(...pubkeys);
      }
    }

    return items;
  }

  getNpub(hex: string) {
    return this.utilities.getNostrIdentifier(hex);
  }

  async publishFollowList() {
    const publicPublicKeys = this.getPublicPublicKeys();

    // await this.feedService.publishContacts(publicPublicKeys);

    this.snackBar.open(`A total of ${publicPublicKeys.length} was added to your public following list`, 'Hide', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
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
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      let pubkey = this.utilities.ensureHexIdentifier(result.pubkey);

      this.dataService.downloadNewestEvents([pubkey], [3]).subscribe((event) => {
        const nostrEvent = event as NostrEventDocument;
        const publicKeys = nostrEvent.tags.map((t) => t[1]);

        for (let i = 0; i < publicKeys.length; i++) {
          const publicKey = publicKeys[i];

          this.profileService.follow(publicKey);

          // const profile = await this.profile.getProfile(publicKey);

          // // If the user already exists in our database of profiles, make sure we keep their previous circle (if unfollowed before).
          // if (profile) {
          //   await this.profile.follow(publicKeys[i], profile.circle);
          // } else {
          //   await this.profile.follow(publicKeys[i]);
          // }
        }

        // await this.load();

        // this.ngZone.run(() => {
        //   this.cd.detectChanges();
        // });
      });

      // TODO: Add ability to slowly query one after one relay, we don't want to receive multiple
      // follow lists and having to process everything multiple times. Just query one by one until
      // we find the list. Until then, we simply grab the first relay only.
      // this.subscriptions.push(
      //   this.feedService.downloadContacts(pubkey).subscribe(async (contacts) => {
      //     const publicKeys = contacts.tags.map((t) => t[1]);

      //     for (let i = 0; i < publicKeys.length; i++) {
      //       const publicKey = publicKeys[i];
      //       const profile = await this.profile.getProfile(publicKey);

      //       // If the user already exists in our database of profiles, make sure we keep their previous circle (if unfollowed before).
      //       if (profile) {
      //         await this.profile.follow(publicKeys[i], profile.circle);
      //       } else {
      //         await this.profile.follow(publicKeys[i]);
      //       }
      //     }

      //     await this.load();

      //     this.ngZone.run(() => {
      //       this.cd.detectChanges();
      //     });
      //   })
      // );
    });
  }

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

      this.circleService.put({
        id: uuidv4(),
        ...result,
      });
    });
  }

  async ngOnInit() {
    this.appState.title = 'Circles';
    this.appState.showBackButton = false;
    this.appState.actions = [
      {
        icon: 'add_circle',
        tooltip: 'Create Circle',
        click: () => {
          this.createCircle();
        },
      },
    ];

    this.subscriptions.push(this.profileService.items$.subscribe((profiles) => (this.following = profiles)) as Subscription);
  }
}
