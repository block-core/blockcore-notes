import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { nip05 } from 'nostr-tools';
import { DataValidation } from '../services/data-validation';
import { Circle, NostrEvent, NostrProfile, NostrEventDocument, NostrProfileDocument, ProfileStatus } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { map, Observable, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CircleDialog } from '../shared/create-circle-dialog/create-circle-dialog';
import { FollowDialog, FollowDialogData } from '../shared/create-follow-dialog/create-follow-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationService } from '../services/navigation';
import { ImportFollowDialog, ImportFollowDialogData } from './import-follow-dialog/import-follow-dialog';
import { DataService } from '../services/data';
import { CircleService } from '../services/circle';
import { OptionsService } from '../services/options';
import { MetricService } from '../services/metric-service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ProfileImageComponent } from '../shared/profile-image/profile-image';
import { ProfileNameComponent } from '../shared/profile-name/profile-name';
import { DirectoryIconComponent } from '../shared/directory-icon/directory-icon';

@Component({
    selector: 'app-people',
    templateUrl: './people.html',
    styleUrls: ['./people.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatInputModule,
      FormsModule,
      MatSelectModule,
      MatCheckboxModule,
      MatProgressSpinnerModule,
      MatTabsModule,
      ProfileImageComponent,
      ProfileNameComponent,
      DirectoryIconComponent
    ]
})
export class PeopleComponent {
  publicKey?: string | null;
  loading = false;
  showBlocked = false;
  showCached = false;
  showMuted = false;
  showAbout = true;
  showFollowingDate = true;
  following: NostrProfileDocument[] = [];
  items: NostrProfileDocument[] = [];
  sortedItems: NostrProfileDocument[] = [];
  selected = 'name-asc';
  searchTerm: any;

  constructor(
    private circleService: CircleService,
    public navigation: NavigationService,
    public appState: ApplicationState,
    private cd: ChangeDetectorRef,
    public dialog: MatDialog,
    public profileService: ProfileService,
    private validator: DataValidation,
    public dataService: DataService,
    public utilities: Utilities,
    private router: Router,
    private snackBar: MatSnackBar,
    public optionsService: OptionsService,
    private metricService: MetricService
  ) {}

  updateSorting() {
    this.optionsService.save();
    const sorting = this.optionsService.values.peopleDisplaySort;

    if (sorting === 'name-asc') {
      this.sortedItems = this.items.sort((a, b) => {
        return a.name?.toLowerCase() < b.name?.toLowerCase() ? -1 : 1;
      });
    } else if (sorting === 'name-desc') {
      this.sortedItems = this.items.sort((a, b) => {
        return a.name?.toLowerCase() < b.name?.toLowerCase() ? 1 : -1;
      });
    } else if (sorting === 'followed-asc') {
      this.sortedItems = this.items.sort((a, b) => {
        return a.followed! < b.followed! ? 1 : -1;
      });
    } else if (sorting === 'followed-desc') {
      this.sortedItems = this.items.sort((a, b) => {
        return a.followed! > b.followed! ? 1 : -1;
      });
    } else if (sorting === 'created-asc') {
      this.sortedItems = this.items.sort((a, b) => {
        return a.created_at! < b.created_at! ? -1 : 1;
      });
    } else if (sorting === 'created-desc') {
      this.sortedItems = this.items.sort((a, b) => {
        return a.created_at! < b.created_at! ? 1 : -1;
      });
    } else if (sorting === 'interesting-asc') {
      this.sortedItems = this.items.sort((a, b) => {
        return this.metricService.get(a.pubkey) < this.metricService.get(b.pubkey) ? 1 : -1;
      });
    } else if (sorting === 'interesting-desc') {
      this.sortedItems = this.items.sort((a, b) => {
        return this.metricService.get(a.pubkey) > this.metricService.get(b.pubkey) ? 1 : -1;
      });
    }
  }

  showChanged() {
    this.load();
    this.optionsService.save();
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  async load() {
    this.loading = true;

    if (this.optionsService.values.peopleDisplayType == 1) {
      this.items = this.profileService.following;
    } else {
      this.items = await this.profileService.getProfilesByStatus(this.optionsService.values.peopleDisplayType);
    }

    this.updateSorting();
    this.loading = false;
  }

  public trackByFn(index: number, item: NostrProfileDocument) {
    return `${item.pubkey}${item.modified}${item.circle}`;
  }

  async ngOnInit() {
    this.appState.updateTitle('People');
    this.appState.showBackButton = false;
    this.appState.actions = [
      {
        icon: 'person_add',
        tooltip: 'Add a person',
        click: () => {
          this.createFollow();
        },
      },
    ];

    await this.load();

    this.subscriptions.push(
      this.profileService.following$.subscribe(async () => {
        console.log('FOLLOWING CHANGED!!!');
        await this.load();
      })
    );

    this.subscriptions.push(
      this.profileService.profilesChanged$.subscribe(async () => {
        console.log('profileService.profilesChanged$!!');
        await this.load();
      })
    );
  }

  subscriptions: Subscription[] = [];

  getFollowingInCircle(id?: number) {
    if (id == null) {
      return this.following.filter((f) => f.circle == null || f.circle == 0);
    } else {
      return this.following.filter((f) => f.circle == id);
    }
  }

  private getPublicPublicKeys() {
    console.log(this.following);
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

  async addFollow(pubkey: string) {
    if (pubkey.startsWith('nsec')) {
      let sb = this.snackBar.open('This is a private key, not a public key.', 'Hide', {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }

    pubkey = this.utilities.ensureHexIdentifier(pubkey);
    await this.profileService.follow(pubkey);
  }

  createFollow(): void {
    const dialogRef = this.dialog.open(FollowDialog, {
      data: {},
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (data: FollowDialogData) => {
      if (!data) {
        return;
      }

      let pubkey = data.pubkey;

      pubkey = pubkey.replaceAll('[', '').replaceAll(']', '').replaceAll('"', '');
      const pubkeys = pubkey.split(',');

      for (let i = 0; i < pubkeys.length; i++) {
        if (pubkeys[i].startsWith('nostr:')) {
          pubkeys[i] = pubkeys[0].replace('nostr:', '');
        }

        if (pubkeys[i].indexOf('.') > -1) {
          if (pubkeys[i].startsWith('@')) {
            pubkeys[i] = pubkeys[i].substring(1);
          }

          const profile = await nip05.queryProfile(pubkeys[i]);

          if (profile) {
            pubkeys[i] = profile.pubkey;
          } else {
            this.snackBar.open(`Unable to find the user.`, 'Hide', {
              duration: 2000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });

            return;
          }
        }

        await this.addFollow(pubkeys[i]);
      }

      setTimeout(() => {
        this.router.navigate(['/p', pubkeys[0]]);
      }, 100);
    });
  }

  async publishFollowList() {
    const publicPublicKeys = this.getPublicPublicKeys();

    await this.dataService.publishContacts(publicPublicKeys);

    this.snackBar.open(`A total of ${publicPublicKeys.length} was added to your public following list`, 'Hide', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async downloadFollowing() {
    const event = await this.dataService.getContactsAndRelays();

    const json = JSON.stringify(event);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `metadata-${this.appState.getPublicKey()}.json`;
    link.click();
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

      if (result.import) {
        const profile = (await this.profileService.getProfile(this.appState.getPublicKey())) as NostrProfileDocument;

        if (!profile || !profile.following) {
          return;
        }

        for (let index = 0; index < profile.following.length; index++) {
          const followKey = profile.following[index];
          await this.profileService.follow(followKey);
        }
      } else {
        for (let index = 0; index < result.pubkeys.length; index++) {
          const followKey = result.pubkeys[index];
          await this.profileService.follow(followKey);
        }
      }
    });
  }
}
