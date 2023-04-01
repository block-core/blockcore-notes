import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentDocument, Invitation, Nip76Wallet, PostDocument, PrivateChannel, Rsvp } from 'animiq-nip76-tools';
import { ApplicationState } from '../../services/applicationstate';
import { NavigationService } from '../../services/navigation';
import { UIService } from '../../services/ui';
import { defaultSnackBarOpts, Nip76Service } from '../nip76.service';
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
    this.router.navigate(['private-channels', channel.dkxPost.signingParent.nostrPubKey, 'notes']);
  }

  viewChannelFollowers(channel: PrivateChannel) {
    this.router.navigate(['private-channels', channel.dkxPost.signingParent.nostrPubKey, 'followers']);
  }

  async copyKeys(invite: Invitation) {
    navigator.clipboard.writeText(await invite.getPointer());
    this.snackBar.open(`The invitation is now in your clipboard.`, 'Hide', defaultSnackBarOpts);
  }

  async previewChannel() {
    const channel = await this.nip76Service.previewChannel();
    if (channel) {
      this.activeChannelId = channel.dkxPost.signingParent.nostrPubKey;
      if (this.tabIndex != 3) {
        this.viewChannelNotes(channel);
      }
    }
  }

  shouldRSVP(channel: PrivateChannel) {
    if (channel.ownerPubKey === this.wallet.ownerPubKey) return false;
    if (channel.invitation?.pointer?.docIndex !== undefined) {
      const huh = this.wallet.rsvps.filter(x => x.content.pointerDocIndex === channel.invitation?.pointer.docIndex);
      return huh.length === 0;
    }
    return false;
  }

  async rsvp(channel: PrivateChannel) {
    this.nip76Service.saveRSVP(channel)
    this.snackBar.open(`Thank you for your RSVP to this channel.`, 'Hide', defaultSnackBarOpts);
  }

  async deleteChannelRSVP(channel: PrivateChannel) {
    if (channel.invitation?.pointer?.docIndex) {
      const rsvp = this.wallet.rsvps.find(x => x.channel === channel
        && x.content.pointerDocIndex === channel.invitation.pointer.docIndex) as Rsvp;
      await this.deleteRSVP(rsvp);
    }

  }

  async deleteRSVP(rsvp: Rsvp) {
    const privateKey = await this.nip76Service.passwordDialog('Delete RSVP');
    if (privateKey) {
      const channelRsvp = rsvp.channel?.rsvps.find(x => x.content.pubkey === this.wallet.ownerPubKey && x.content.pointerDocIndex === rsvp.content.pointerDocIndex);
      if (await this.nip76Service.deleteDocument(rsvp, privateKey)) {
        rsvp.dkxParent.documents.splice(rsvp.dkxParent.documents.indexOf(rsvp), 1);
        if (channelRsvp) {
          if (await this.nip76Service.deleteDocument(channelRsvp, privateKey)) {
            channelRsvp.dkxParent.documents.splice(channelRsvp.dkxParent.documents.indexOf(channelRsvp), 1);
          }
        }
      }
    }
  }

  async deleteInvitation(invite: Invitation) {
    const privateKey = await this.nip76Service.passwordDialog('Delete Invitation');
    if (privateKey) {
      if (await this.nip76Service.deleteDocument(invite, privateKey)) {
        invite.dkxParent.documents.splice(invite.dkxParent.documents.indexOf(invite), 1);
      }
    }
  }

  createDate(doc: ContentDocument) {
    return new Date(doc.nostrEvent.created_at * 1000)
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

  addEmojiNote(event: { emoji: { native: any } }) {
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
