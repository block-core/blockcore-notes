import { Component, Input, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Invitation, Nip76Wallet, PostDocument, PrivateChannel, Rsvp } from 'animiq-nip76-tools';
import { CircleService } from 'src/app/services/circle';
import { Circle, NostrProfileDocument } from 'src/app/services/interfaces';
import { ProfileService } from 'src/app/services/profile';
import { defaultSnackBarOpts, Nip76Service } from '../nip76.service';

@Component({
  selector: 'app-nip76-channel-notes',
  templateUrl: './nip76-channel-notes.component.html',
  styleUrls: ['./nip76-channel-notes.component.scss']
})
export class Nip76ChannelNotesComponent {
  showNoteForm = false;
  isEmojiPickerVisible = false;
  @ViewChild('picker') picker: unknown;
  @ViewChild('noteContent') noteContent?: FormControl;
  noteForm = this.fb.group({
    content: ['', Validators.required],
    expiration: [''],
    dateControl: [],
  });

  @Input()
  channel!: PrivateChannel;

  constructor(
    private profiles: ProfileService,
    private circleService: CircleService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    public nip76Service: Nip76Service
  ) { }

  get wallet(): Nip76Wallet {
    return this.nip76Service.wallet;
  }

  public trackByFn(index: number, item: PostDocument) {
    return item.nostrEvent.id;
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
    if (await this.nip76Service.saveNote(this.channel!, this.noteForm.controls.content.value!)) {
      this.noteForm.reset();
      this.showNoteForm = false;
    }
  }

  shouldRSVP(channel: PrivateChannel) {
    if (channel.dkxPost.signingParent.privateKey) return false;
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
}
