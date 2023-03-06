import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HDKey, HDKissAddress, HDKissDocumentType, IThreadPayload, PostDocument, PrivateThread, Versions } from 'animiq-nip76-tools';
import { Subject } from 'rxjs';
import { RelayService } from 'src/app/services/relay';
import { ApplicationState } from '../../services/applicationstate';
import { NostrEvent, NostrProfileDocument, NostrRelaySubscription } from '../../services/interfaces';
import { NavigationService } from '../../services/navigation';
import { Nip76Service } from '../../services/nip76.service';
import { ProfileService } from '../../services/profile';
import { UIService } from '../../services/ui';
@Component({
  selector: 'app-private-threads',
  templateUrl: './private-threads.component.html',
  styleUrls: ['./private-threads.component.scss']
})
export class PrivateThreadsComponent {
  profile?: NostrProfileDocument;
  privateThreads: PrivateThread[] = [];
  privateThreadsSubId = ''
  privateNotesSubId = ''

  private _editThread: PrivateThread | null = null;

  activeThreadPubKey: string | null = null;
  activeThread: PrivateThread | undefined;
  isEmojiPickerVisible = false;
  @ViewChild('picker') picker: unknown;
  @ViewChild('noteContent') noteContent?: FormControl;
  noteForm = this.fb.group({
    content: ['', Validators.required],
    expiration: [''],
    dateControl: [],
  });

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public navigation: NavigationService,
    public appState: ApplicationState,
    public ui: UIService,
    private profileService: ProfileService,
    private relayService: RelayService,
    public nip76Service: Nip76Service,
    private fb: FormBuilder,
  ) { }

  async ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      this.activeThreadPubKey = params.get('threadPubKey');
      const thread = this.nip76Service.wallet.threads.find(x => this.activeThreadPubKey === x.ap.publicKey.toString('hex'));
      if (thread) this.initNotes(thread);
    });

    this.profileService.profile$.subscribe((profile) => {
      this.profile = profile;
      this.ui.setProfile(this.profile);
    });

    if (this.nip76Service.wallet.isGuest) {
      this.randomize();
    } else {
      this.nip76Service.privateThreads.subscribe(threads => {
        this.initThreads(threads);
      });
    }
  }

  initThreads(threads: PrivateThread[]) {
    if (!this.nip76Service.wallet.isGuest && threads.length) {

      this.privateThreads = threads;
      if (this.privateThreadsSubId) {
        this.relayService.unsubscribe(this.privateThreadsSubId);
      }

      const privateThreads$ = new Subject<NostrEvent>();
      privateThreads$.subscribe(nostrEvent => {
        const thread = this.nip76Service.wallet.threads.find(x => nostrEvent.pubkey === x.ap.publicKey.toString('hex'));
        if (thread) {
          thread.ownerPubKey = this.profile?.pubkey!;
          thread.p = JSON.parse(nostrEvent.content) as IThreadPayload;
          thread.ready = true;
        }
      });

      const threadPubKeys = this.nip76Service.wallet.threads.map(x => x.ap.publicKey.toString('hex'));
      this.privateThreadsSubId = this.relayService.subscribe([{
        authors: threadPubKeys,
        kinds: [17761],
        limit: 100
      }], 'nip76.privateThreads.List', 'Replaceable', privateThreads$).id;
    }
  }

  initNotes(thread: PrivateThread | undefined, indexStart = 0) {
    this.activeThread = thread;
    if (!this.nip76Service.wallet.isGuest && this.activeThread) {
      if (this.privateNotesSubId) {
        this.relayService.unsubscribe(this.privateNotesSubId);
      }
      const privateNotes$ = new Subject<NostrEvent>();
      privateNotes$.subscribe(nostrEvent => {
        let keyIndex = 0;
        let ap: HDKey;
        let sp: HDKey | undefined;
        for (let i = indexStart; i < indexStart + 10; i++) {
          ap = this.activeThread!.indexMap.post.ap.deriveChildKey(i);
          if (nostrEvent.pubkey === ap.publicKey.toString('hex')) {
            keyIndex = i;
            sp = this.activeThread!.indexMap.post.sp.deriveChildKey(i);
            break;
          }
        }
        if (sp) {
          const post = PostDocument.default;
          post.setKeys(ap!, sp!);
          post.address = new HDKissAddress({ publicKey: ap!.publicKey, type: HDKissDocumentType.Post, version: Versions.animiqAPI3 });
          post.thread = this.activeThread!;
          post.s = nostrEvent.sig;
          post.h = nostrEvent.id;
          post.a = post.a = post.address.value;
          post.v = 3;
          post.e = nostrEvent.content;
          post.i = keyIndex;
          post.t = nostrEvent.created_at;
          // this.activeThread?.indexMap.post.decrypt(post);
          const decrypted = post.address.decrypt(post.e, sp.publicKey, post.v);
          post.p = JSON.parse(decrypted);
          nostrEvent.content = post.p.message!;
          post.nostrEvent = nostrEvent;
          this.activeThread!.posts.push(post);
        }
      });

      const notePubKeys: string[] = [];
      for (let i = indexStart; i < indexStart + 10; i++) {
        const ap = this.activeThread.indexMap.post.ap.deriveChildKey(i);
        notePubKeys.push(ap.publicKey.toString('hex'));
      }
      this.privateNotesSubId = this.relayService.subscribe([{
        authors: notePubKeys,
        kinds: [17761],
        limit: 100
      }], `nip76.privateNotes.${this.activeThread.a}.List`, 'Replaceable', privateNotes$).id;
    }
  }

  public trackByFn(index: number, item: PostDocument) {
    return item.a;
  }

  randomize() {
    this.nip76Service.wallet.reKey();
    this.privateThreads = [this.nip76Service.wallet.threads[0]];
    this._editThread = this.privateThreads[0];
    this.privateThreads[0].pending = 'preview';
    this.privateThreads[0].p.name = 'Example Thread 1';
    this.privateThreads[0].p.description = 'My First Private Trace Resistant Thread 1';
    this.privateThreads[0].ready = true;
  }

  async saveKey() {
    const savedLocal = await this.nip76Service.saveKeyWithPassword();
    const savedRemote = await this.nip76Service.updateThreadMetadata(this.privateThreads[0]);
    // location.reload();
  }

  get editThread(): PrivateThread | null {
    return this._editThread!;
  }
  set editThread(value: PrivateThread | null) {
    this.cancelEdit();
    this._editThread = value;
  }

  viewThread(thread: PrivateThread) {
    this.router.navigate(['profile', 'private-threads', thread.ap.publicKey.toString('hex')]);
  }

  addThread() {
    this.cancelEdit();
    const firstAvailable = this.privateThreads.find(x => !x.ready);
    if (firstAvailable) {
      firstAvailable.pending = firstAvailable.a;
      firstAvailable.ready = true;
      firstAvailable.p.name = 'New Thread';
      this._editThread = firstAvailable;
    }
  }

  cancelEdit() {
    if (this._editThread && this._editThread.pending === this._editThread.a) {
      this._editThread.pending = '';
      this._editThread.ready = false;
    }
    this._editThread = null;
  }

  async saveThread() {
    this._editThread!.pending = '';
    const savedRemote = await this.nip76Service.updateThreadMetadata(this._editThread!);
    if (savedRemote) {
      this._editThread = null;
    }
  }

  public addEmojiNote(event: { emoji: { native: any } }) {
    let startPos = (<any>this.noteContent).nativeElement.selectionStart;
    let value = this.noteForm.controls.content.value;

    let parsedValue = value?.substring(0, startPos) + event.emoji.native + value?.substring(startPos, value.length);
    this.noteForm.controls.content.setValue(parsedValue);
    this.isEmojiPickerVisible = false;

    (<any>this.noteContent).nativeElement.focus();
  }

  async saveNote() {
    await this.nip76Service.saveNote(this.activeThread!, this.noteForm.controls.content.value!);
  }
}
