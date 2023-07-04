import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { relayInit, Relay, Event } from 'nostr-tools';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrEventDocument, NostrNoteDocument, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { map, Observable, shareReplay, Subscription, debounceTime, fromEvent } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { OptionsService } from '../services/options';
import { AuthenticationService } from '../services/authentication';
import { NavigationService } from '../services/navigation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../services/data';
import { StorageService } from '../services/storage';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UIService } from '../services/ui';

interface DefaultProfile {
  pubkey: string;
  pubkeynpub: string;
  name: string;
  picture: string;
  about: string;
  checked: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  // animations: [
  //   trigger('fade', [
  //     transition('void => active', [
  //       // using status here for transition
  //       style({ opacity: 0 }),
  //       animate(250, style({ opacity: 1 })),
  //     ]),
  //     transition('* => void', [animate(250, style({ opacity: 0 }))]),
  //   ]),
  // ],
})
export class HomeComponent {
  publicKey?: string | null;
  subscriptions: Subscription[] = [];

  lists = [
    { name: 'Nostr', about: 'Influencial nostr developers and community people', pubkey: 'npub15xrwvftyzynahpl5fmpuv9wtkg9q52j8q73saw59u8tmx63ktx8sfclgss', pubkeyhex: 'a186e625641127db87f44ec3c615cbb20a0a2a4707a30eba85e1d7b36a36598f' },
    { name: 'Bitcoin', about: 'Influencial Bitcoin people', pubkey: 'npub175ag9cus82a0zzpkheaglnudpvsc8q046z82cyz9gmauzlve6r2s4k9fpm', pubkeyhex: 'f53a82e3903abaf10836be7a8fcf8d0b218381f5d08eac104546fbc17d99d0d5' },
    { name: 'Blockcore', about: 'Follow the Blockcore developers', pubkey: 'npub1zfy0r7x8s3xukajewkmmzxjj3wpfan7apj5y7szz7y740wtf6p5q3tdyy9', pubkeyhex: '1248f1f8c7844dcb765975b7b11a528b829ecfdd0ca84f4042f13d57b969d068' },
  ];

  @ViewChild('picker') picker: unknown;

  isEmojiPickerVisible: boolean | undefined;

  formGroup!: UntypedFormGroup;

  defaults: DefaultProfile[] = [
    {
      pubkeynpub: 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6',
      pubkey: '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
      name: 'fiatjaf',
      picture: 'https://pbs.twimg.com/profile_images/539211568035004416/sBMjPR9q_normal.jpeg',
      about: 'buy my merch at fiatjaf store',
      checked: false,
    },
    {
      pubkeynpub: 'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m',
      pubkey: '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
      name: 'jack',
      picture: 'https://pbs.twimg.com/profile_images/1115644092329758721/AFjOr-K8_normal.jpg',
      about: 'bitcoin...twttr/@jack',
      checked: false,
    },
    {
      pubkeynpub: 'npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s',
      pubkey: '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
      name: 'jb55',
      picture: 'https://pbs.twimg.com/profile_images/1362882895669436423/Jzsp1Ikr_normal.jpg',
      about: 'damus.io author. bitcoin and nostr dev',
      checked: false,
    },
    {
      pubkeynpub: 'npub1v4v57fu60zvc9d2uq23cey4fnwvxlzga9q2vta2n6xalu03rs57s0mxwu8',
      pubkey: '65594f279a789982b55c02a38c92a99b986f891d2814c5f553d1bbfe3e23853d',
      name: 'hampus',
      picture: 'https://pbs.twimg.com/profile_images/1517505111991504896/9qixSAMn_normal.jpg',
      about: '',
      checked: false,
    },
    {
      pubkeynpub: 'npub1zl3g38a6qypp6py2z07shggg45cu8qex992xpss7d8zrl28mu52s4cjajh',
      pubkey: '17e2889fba01021d048a13fd0ba108ad31c38326295460c21e69c43fa8fbe515',
      name: 'sondreb',
      picture: 'https://sondreb.com/favicon.png',
      about: 'Developer 🦸‍♂️ of Blockcore Notes and Blockcore Wallet',
      checked: false,
    },
  ];

  constructor(
    public ui: UIService,
    public db: StorageService,
    public appState: ApplicationState,
    private cd: ChangeDetectorRef,
    public options: OptionsService,
    public dialog: MatDialog,
    public navigation: NavigationService,
    public profileService: ProfileService,
    private validator: DataValidation,
    private authService: AuthenticationService,
    private utilities: Utilities,
    private snackBar: MatSnackBar,
    private dataService: DataService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private ngZone: NgZone,
    private formBuilder: UntypedFormBuilder
  ) {
    console.log('HOME constructor!!'); // Hm.. called twice, why?
  }

  note?: string;

  public addEmoji(event: { emoji: { native: any } }) {
    // this.dateControl.setValue(this.dateControl.value + event.emoji.native);
    this.note = `${this.note}${event.emoji.native}`;
    this.isEmojiPickerVisible = false;
  }

  onCancel() {
    this.note = '';
  }

  postNote() {
    this.navigation.saveNote(this.note);
  }

  async follow(profile: DefaultProfile) {
    if (profile.checked) {
      await this.profileService.follow(profile.pubkey, 0, profile as any);
    }
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  public trackByProfile(index: number, item: DefaultProfile) {
    return `${item.pubkey}${item.checked}`;
  }

  public trackByNoteId(index: number, item: NostrNoteDocument) {
    return item.id;
  }

  latestItems: NostrEventDocument[] = []; // = dexieToRx(liveQuery(() => this.db.events.orderBy('created_at').reverse().limit(7).toArray()));

  sub: any;
  relay?: Relay;
  initialLoad = true;
  details = false;

  toggleDetails() {
    this.details = !this.details;
  }

  import(pubkey: string) {
    this.dataService.enque({
      identifier: pubkey,
      type: 'Contacts',
      // TODO: MIGRATE LOGIC!!!
      // callback: (data: NostrEventDocument) => {
      //   console.log('DATA RECEIVED', data);

      //   const following = data.tags.map((t) => t[1]);

      //   for (let i = 0; i < following.length; i++) {
      //     const publicKey = following[i];
      //     this.profileService.follow(publicKey);
      //   }
      // },
    });
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  feedChanged($event: any, type: string) {
    if (type === 'public') {
      // If user choose public and set the value to values, we'll turn on the private.
      if (!this.options.values.publicFeed) {
        this.options.values.privateFeed = true;
      } else {
        this.options.values.privateFeed = false;
      }
    } else {
      // If user choose private and set the value to values, we'll turn on the public.
      if (!this.options.values.privateFeed) {
        this.options.values.publicFeed = true;
      } else {
        this.options.values.publicFeed = false;
      }
    }
  }

  images = [
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/600/800',
    'https://picsum.photos/seed/6/800/800',
    'https://picsum.photos/seed/7/800/600',
    'https://picsum.photos/seed/8/600/800',
    'https://picsum.photos/seed/9/800/800',
    'https://picsum.photos/seed/10/800/600',
    'https://picsum.photos/seed/11/600/800',
    'https://picsum.photos/seed/12/800/800',
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/600/800',
    'https://picsum.photos/seed/3/800/800',
  ];

  async ngOnInit() {
    this.options.values.privateFeed = true;

    this.formGroup = this.formBuilder.group({
      note: ['', Validators.required],
      expiration: [''],
      dateControl: [],
    });

    // useReactiveContext // New construct in Angular 14 for subscription.
    // https://medium.com/generic-ui/the-new-way-of-subscribing-in-an-angular-component-f74ef79a8ffc

    this.appState.updateTitle('Blockcore Notes');
    this.appState.showBackButton = false;
    this.appState.showLogo = true;
    this.appState.actions = [
      {
        icon: 'note_add',
        tooltip: 'Create Note',
        click: () => {
          this.navigation.createNote();
        },
      },
    ];

    this.latestItems = await this.db.storage.getEventsByCreatedAndKind(7, 1);

    this.subscriptions.push(
      this.profileService.following$.subscribe((profiles) => {
        // this.profileCount = Math.floor(window.innerWidth / this.profileThumbnailWidth);
        this.profileCount = 75;
        this.profiles = profiles.slice(0, this.profileCount);
      })
    );

    // this.resizeObservable$ = fromEvent(window, 'resize');

    // this.resizeSubscription$ = this.resizeObservable$.pipe(debounceTime(100)).subscribe((evt) => {
    //   this.profileCount = Math.floor(window.innerWidth / this.profileThumbnailWidth);
    //   this.profiles = this.profileService.following.slice(0, this.profileCount);
    // });
  }

  profileThumbnailWidth = 72;
  profileCount = 1;
  resizeObservable$!: Observable<globalThis.Event>;
  resizeSubscription$!: Subscription;

  /** Profiles that are shown on the home screen, limited set of profiles. */
  profiles: NostrProfileDocument[] = [];
}
