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
import { Subscription } from 'rxjs';

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
    this.utilities.unsubscribe(this.subscriptions);
  }

  circles: Circle[] = [];

  async load() {
    this.loading = true;
    this.circles = await this.circlesService.list();
    this.following = await this.profile.followList();
    this.loading = false;
  }

  async deleteCircle(id: string) {
    const pubKeys = this.getFollowingInCircle(id).map((f) => f.pubkey);

    await this.circlesService.deleteCircle(id);

    for (var i = 0; i < pubKeys.length; i++) {
      await this.profile.setCircle(pubKeys[i], '');
    }

    await this.load();
  }

  countMembers(circle: Circle) {
    return this.getFollowingInCircle(circle.id).length;
  }

  subscriptions: Subscription[] = [];

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

      // TODO: Add ability to slowly query one after one relay, we don't want to receive multiple
      // follow lists and having to process everything multiple times. Just query one by one until
      // we find the list. Until then, we simply grab the first relay only.
      this.subscriptions.push(
        this.feedService.downloadContacts(pubkey).subscribe(async (contacts) => {
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
        })
      );
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

  getFollowingInCircle(id: string) {
    if (id == null || id == '') {
      return this.following.filter((f) => f.circle == null || f.circle == '');
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
    console.log(this.circles);
    console.log(this.following);

    const items: string[] = [];

    for (let i = 0; i < this.circles.length; i++) {
      const circle = this.circles[i];

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

    await this.feedService.publishContacts(publicPublicKeys);

    this.snackBar.open(`A total of ${publicPublicKeys.length} was added to your public following list`, 'Hide', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
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

      this.circlesService.putCircle({
        id: uuidv4(),
        ...result,
      });

      await this.load();
    });
  }

  async ngOnInit() {
    console.log('CIRCLE NG ON INIT!');
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
  }
}
