import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Nip76Wallet, PostDocument, PrivateChannel } from 'animiq-nip76-tools';
import { ApplicationState } from '../../services/applicationstate';
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
  private _editChannel: PrivateChannel | null = null;
  activeChannelId!: string | null;
  // _activeChannel: PrivateChannel | undefined;
  isEmojiPickerVisible = false;
  @ViewChild('picker') picker: unknown;
  @ViewChild('noteContent') noteContent?: FormControl;
  noteForm = this.fb.group({
    content: ['', Validators.required],
    expiration: [''],
    dateControl: [],
  });

  get wallet(): Nip76Wallet {
    return this.nip76Service.wallet;
  }

  get readyPosts(): PostDocument[] {
    return this.activeChannel ? this.activeChannel.posts : [];
  }

  get activeChannel(): PrivateChannel | undefined {
    return this.activeChannelId ? this.nip76Service.findChannel(this.activeChannelId) : undefined;
  }

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

  async ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      this.tabIndex = this.activatedRoute.snapshot.data['tabIndex'] as number || 0;
      this.activeChannelId = params.get('channelPubKey');
      if (this.activeChannelId) {
        if (this.tabIndex < 2) this.tabIndex = 3;
      }
    });
  }

  public trackByFn(index: number, item: PostDocument) {
    return item.nostrEvent.id;
  }

  randomizeKey() {
    this.wallet.reKey();
    this.editChannel = this.wallet.channels[0];
    this.editChannel.editing = true;
    this.editChannel.content.name = 'Example Channel 1';
    this.editChannel.content.about = 'My First Trace Resistant Channel 1';
    this.editChannel.ready = true;
  }

  async saveConfiguration() {
    const savedLocal = await this.nip76Service.saveWallet();
    const savedRemote = await this.nip76Service.saveChannel(this.editChannel!);
    location.reload();
  }

  get editChannel(): PrivateChannel | null {
    return this._editChannel!;
  }
  set editChannel(value: PrivateChannel | null) {
    this.cancelEdit();
    this._editChannel = value;
  }

  onTabChanged(event: MatTabChangeEvent) {
    this.tabIndex = event.index;
    switch (event.index) {
      case 0:
        this.router.navigate(['/private-channels']);
        break;
      case 1:
        this.router.navigate(['/private-channels/following']);
        break;
      case 2:
        this.viewChannelFollowers(this.wallet.channels[0]);
        break;
      case 3:
        this.viewChannelNotes(this.wallet.channels[0]);
        break;
    }
  }

  viewChannelNotes(channel: PrivateChannel) {
    this.router.navigate(['private-channels', channel.hdkIndex.signingParent.nostrPubKey, 'notes']);
  }

  viewChannelFollowers(channel: PrivateChannel) {
    this.router.navigate(['private-channels', channel.hdkIndex.signingParent.nostrPubKey, 'followers']);
  }

  async copyKeys(channel: PrivateChannel) {
    navigator.clipboard.writeText(await channel.getChannelPointer());
    this.snackBar.open(`Channel keys are now in your clipboard.`, 'Hide', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async previewChannel() {
    const channel = await this.nip76Service.previewChannel();
    if (channel) {
      this.activeChannelId = channel.hdkIndex.signingParent.nostrPubKey;
      if (this.tabIndex != 1) {
        // this.viewChannelFollowers(channel);
        this.router.navigate(['private-channels','following']);
      } 
    }
  }

  async follow(channel: PrivateChannel) {
    this.nip76Service.saveFollowing(channel)
    this.snackBar.open(`You are now following this channel.`, 'Hide', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  addChannel() {
    this.cancelEdit();
    let newChannel = this.wallet.createChannel()
    newChannel.ready = newChannel.editing = true;
    this._editChannel = newChannel;
  }

  cancelEdit() {
    if (this._editChannel && this._editChannel.editing) {
      this._editChannel.editing = false;
      this._editChannel.ready = false;
    }
    this._editChannel = null;
  }

  async saveChannel() {
    this._editChannel!.editing = false;
    const savedRemote = await this.nip76Service.saveChannel(this._editChannel!);
    if (savedRemote) {
      this._editChannel = null;
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
    if (await this.nip76Service.saveNote(this.activeChannel!, this.noteForm.controls.content.value!)) {
      this.noteForm.reset();
      this.showNoteForm = false;
    }
  }
}
