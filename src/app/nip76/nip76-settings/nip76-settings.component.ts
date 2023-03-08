import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { PostDocument, PrivateThread } from 'animiq-nip76-tools';
import { ApplicationState } from '../../services/applicationstate';
import { NostrProfileDocument } from '../../services/interfaces';
import { NavigationService } from '../../services/navigation';
import { UIService } from '../../services/ui';
import { Nip76Service } from '../nip76.service';
@Component({
  selector: 'app-nip76-settings',
  templateUrl: './nip76-settings.component.html',
  styleUrls: ['./nip76-settings.component.scss']
})
export class Nip76SettingsComponent {
  tabIndex?: number;
  showNoteForm = false;
  private _editThread: PrivateThread | null = null;
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
    private snackBar: MatSnackBar,
    public navigation: NavigationService,
    public appState: ApplicationState,
    public ui: UIService,
    public nip76Service: Nip76Service,
    private fb: FormBuilder,
  ) { }

  get profile(): NostrProfileDocument {
    return this.nip76Service.profile;
  }

  async ngOnInit() {
    if (this.nip76Service.wallet.isGuest) {
      this.randomizeKey();
    }
    this.activatedRoute.paramMap.subscribe(async (params) => {
      this.tabIndex = this.activatedRoute.snapshot.data['tabIndex'] as number || 0;
      const activeThreadPubKey = params.get('threadPubKey');
      const thread = this.nip76Service.threads.find(x => activeThreadPubKey === x.ap.publicKey.slice(1).toString('hex'));
      if (thread) {
        this.activeThread = thread;
        if (this.tabIndex < 2) this.tabIndex = 3;
        if (this.tabIndex === 3 && !thread.sub) {
          this.nip76Service.loadNotes(this.activeThread);
        }
      }
    });
  }

  public trackByFn(index: number, item: PostDocument) {
    return item.a;
  }

  randomizeKey() {
    this.nip76Service.wallet.reKey();
    this.editThread = this.nip76Service.wallet.threads[0];
    this.editThread.pending = 'preview';
    this.editThread.p.name = 'Example Thread 1';
    this.editThread.p.description = 'My First Private Trace Resistant Thread 1';
    this.editThread.ready = true;
  }

  async saveConfiguration() {
    const savedLocal = await this.nip76Service.save();
    const savedRemote = await this.nip76Service.updateThreadMetadata(this.editThread!);
    location.reload();
  }

  get editThread(): PrivateThread | null {
    return this._editThread!;
  }
  set editThread(value: PrivateThread | null) {
    this.cancelEdit();
    this._editThread = value;
  }

  onTabChanged(event: MatTabChangeEvent) {
    this.tabIndex = event.index;
    switch (event.index) {
      case 0:
        this.router.navigate(['/private-threads']);
        break;
      case 1:
        this.router.navigate(['/private-threads/following']);
        break;
      case 2:
        this.viewThreadFollowers(this.nip76Service.threads[0]);
        break;
      case 3:
        this.viewThreadNotes(this.nip76Service.threads[0]);
        break;
    }
  }

  viewThreadNotes(thread: PrivateThread) {
    this.router.navigate(['private-threads', thread.ap.publicKey.slice(1).toString('hex'), 'notes']);
  }

  viewThreadFollowers(thread: PrivateThread) {
    this.router.navigate(['private-threads', thread.ap.publicKey.slice(1).toString('hex'), 'followers']);
  }

  copyKeys(thread: PrivateThread) {
    navigator.clipboard.writeText(thread.thread);
    this.snackBar.open(`Thread keys are now in your clipboard.`, 'Hide', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async previewThread() {
    const thread = await this.nip76Service.previewThread();
    if (thread) {
      if (this.tabIndex != 3) {
        this.viewThreadNotes(thread);
      } else {
        this.activeThread = thread;
      }
    }
  }

  addThread() {
    this.cancelEdit();
    const firstAvailable = this.nip76Service.wallet.threads.find(x => !x.ready);
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
    if (await this.nip76Service.saveNote(this.activeThread!, this.noteForm.controls.content.value!)) {
      this.noteForm.reset();
      this.showNoteForm = false;
    }
  }
}
