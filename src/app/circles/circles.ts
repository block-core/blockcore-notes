import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { DataValidation } from '../services/data-validation';
import { Circle, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { CircleService } from '../services/circle';
import { CircleDialog } from '../shared/create-circle-dialog/create-circle-dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../services/authentication';
import { copyToClipboard } from '../shared/utilities';
import { Subscription, tap } from 'rxjs';
import { DataService } from '../services/data';
import { NavigationService } from '../services/navigation';

@Component({
  selector: 'app-circles',
  templateUrl: './circles.html',
  styleUrls: ['./circles.css'],
})
export class CirclesComponent {
  publicKey?: string | null;
  loading = false;
  searchTerm: any;

  constructor(
    public navigation: NavigationService,
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
      return this.profileService.following.filter((f) => f.circle == null || f.circle == 0);
    } else {
      return this.profileService.following.filter((f) => f.circle == id);
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
    // console.log(this.items);
    console.log(this.profileService.following);

    const items: string[] = [];

    for (let i = 0; i < this.circleService.circles.length; i++) {
      const circle = this.circleService.circles[i];

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

  createCircle(): void {
    const dialogRef = this.dialog.open(CircleDialog, {
      data: { name: '', style: 1, public: true },
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }

      this.circleService.put(result);
    });
  }

  async ngOnInit() {
    this.appState.updateTitle('Circles');
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

    // this.subscriptions.push(this.profileService.items$.subscribe((profiles) => (this.following = profiles)) as Subscription);
  }
}
