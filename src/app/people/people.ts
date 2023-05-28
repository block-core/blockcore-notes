import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { nip05, relayInit } from 'nostr-tools';
import * as moment from 'moment';
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

@Component({
  selector: 'app-people',
  templateUrl: './people.html',
  styleUrls: ['./people.css'],
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
  // items$ = this.profileService.items$;

  // sortedItems$ = this.items$.pipe(
  //   map((data) => {
  //     data.sort((a, b) => {
  //       // if (a.name && !b.name) {
  //       //   return -1;
  //       // }

  //       // if (b.name && !a.name) {
  //       //   return 1;
  //       // }

  //       // if (!a.name && !b.name) {
  //       //   return 0;
  //       // }

  //       return a.name?.toLowerCase() < b.name?.toLowerCase() ? -1 : 1;
  //     });

  //     return data;
  //   })
  // );

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

  // async clearBlocked() {
  //   await this.profileService.clearBlocked();
  //   this.profiles = [];
  //   await this.load();
  // }

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

  // optionsUpdated($event: any, type: any) {
  //   if (type == 1) {
  //     this.showCached = false;
  //     this.showMuted = false;
  //   } else if (type == 2) {
  //     this.showCached = false;
  //     this.showBlocked = false;
  //   } else if (type == 3) {
  //     this.showBlocked = false;
  //     this.showMuted = false;
  //   }

  //   this.load();
  // }

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

    // TODO: Until we changed to using observable (DataService) for all data,
    // we have this basic observable whenever the profiles changes.
    this.subscriptions.push(
      this.profileService.profilesChanged$.subscribe(async () => {
        console.log('profileService.profilesChanged$!!');
        await this.load();
      })
    );
  }

  subscriptions: Subscription[] = [];

  // async search() {
  //   const text: string = this.searchTerm;

  //   // First load the current list.
  //   await this.load();

  //   if (text == 'undefined' || text == null || text == '') {
  //   } else {
  //     this.profiles = this.profiles.filter((item: NostrProfileDocument) => item.name?.indexOf(text) > -1 || item.pubkey?.indexOf(text) > -1 || item.about?.indexOf(text) > -1 || item.nip05?.indexOf(text) > -1);
  //   }
  // }

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
    // this.feedService.downloadRecent([pubkey]);
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
          // If the user enters a root account with only @, we'll have to replace it for the NIP query to work.
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

      // let pubkey = this.utilities.ensureHexIdentifier(result.pubkey);

      // Queue download for import.
      // this.dataService.enque({ type: 'Contacts', identifier: pubkey });

      // this.dataService.downloadNewestContactsEvents([pubkey]).subscribe((event) => {
      //   debugger;
      //   const nostrEvent = event as NostrEventDocument;
      //   const publicKeys = nostrEvent.tags.map((t) => t[1]);

      //   for (let i = 0; i < publicKeys.length; i++) {
      //     const publicKey = publicKeys[i];

      //     this.profileService.follow(publicKey);

      //     // const profile = await this.profile.getProfile(publicKey);

      //     // // If the user already exists in our database of profiles, make sure we keep their previous circle (if unfollowed before).
      //     // if (profile) {
      //     //   await this.profile.follow(publicKeys[i], profile.circle);
      //     // } else {
      //     //   await this.profile.follow(publicKeys[i]);
      //     // }
      //   }

      //   // await this.load();

      //   // this.ngZone.run(() => {
      //   //   this.cd.detectChanges();
      //   // });
      // });

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
}
