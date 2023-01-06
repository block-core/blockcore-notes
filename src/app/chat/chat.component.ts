import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { NostrEvent, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { StorageService } from '../services/storage.service';
import { map, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CircleDialog } from '../shared/create-circle-dialog/create-circle-dialog';
import { FollowDialog, FollowDialogData } from '../shared/create-follow-dialog/create-follow-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedService } from '../services/feed.service';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  publicKey?: string | null;
  loading = false;
  showBlocked = false;
  showCached = false;
  searchTerm: any;
  constructor(
    public navigation: NavigationService,
    public appState: ApplicationState,
    private cd: ChangeDetectorRef,
    public dialog: MatDialog,
    private storage: StorageService,
    private feedService: FeedService,
    private profileService: ProfileService,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  // async clearBlocked() {
  //   await this.profileService.clearBlocked();
  //   this.profiles = [];
  //   await this.load();
  // }

  async optionsUpdated($event: any, type: any) {
    if (type == 1) {
      this.showCached = false;
    } else {
      this.showBlocked = false;
    }

    await this.load();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  sub?: Subscription;
  profiles: NostrProfileDocument[] = [];

  async load() {
    this.loading = true;

    if (this.showBlocked) {
      this.profiles = await this.profileService.blockList();
    } else if (this.showCached) {
      this.profiles = await this.profileService.publicList();
    } else {
      this.profiles = await this.profileService.followList();
    }

    this.loading = false;
  }

  public trackByFn(index: number, item: NostrProfileDocument) {
    return item.pubkey;
  }

  async ngOnInit() {
    this.appState.title = 'Chat';
    this.appState.showBackButton = true;
    this.appState.actions = [
      {
        icon: 'person_add',
        tooltip: 'Add a person',
        click: () => {
          this.createFollow();
        },
      },
    ];

    // TODO: Until we changed to using observable (DataService) for all data,
    // we have this basic observable whenever the profiles changes.
    this.sub = this.profileService.profilesChanged$.subscribe(async () => {
      await this.load();
    });
  }

  async search() {
    const text: string = this.searchTerm;

    // First load the current list.
    await this.load();

    if (text == 'undefined' || text == null || text == '') {
    } else {
      this.profiles = this.profiles.filter((item: NostrProfileDocument) => item.name?.indexOf(text) > -1 || item.pubkey?.indexOf(text) > -1 || item.about?.indexOf(text) > -1 || item.nip05?.indexOf(text) > -1);
    }
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
    await this.feedService.downloadRecent([pubkey]);
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
        await this.addFollow(pubkeys[i]);
      }
    });
  }
}
