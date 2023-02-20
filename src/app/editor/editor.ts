import { Component, ViewChild } from '@angular/core';
import { FormControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NavigationService } from '../services/navigation';
import { Location } from '@angular/common';
import { ApplicationState } from '../services/applicationstate';

export interface NoteDialogData {
  note: string;
}

@Component({
  selector: 'app-editor',
  templateUrl: 'editor.html',
  styleUrls: ['editor.css'],
})
export class EditorComponent {
  @ViewChild('picker') picker: unknown;

  isEmojiPickerVisible: boolean | undefined;

  formGroup!: UntypedFormGroup;

  note: string = '';

  minDate?: number;

  public dateControl = new FormControl(null);

  constructor(private appState: ApplicationState, private location: Location, private formBuilder: UntypedFormBuilder, public navigation: NavigationService) {}

  ngOnInit() {
    this.appState.updateTitle(`Write a note`);
    this.appState.showBackButton = true;
    this.appState.showLogo = true;
    this.appState.actions = [];

    this.minDate = Date.now();

    this.formGroup = this.formBuilder.group({
      note: ['', Validators.required],
      expiration: [''],
      dateControl: [],
    });
  }

  public addEmoji(event: { emoji: { native: any } }) {
    // this.dateControl.setValue(this.dateControl.value + event.emoji.native);
    this.note = `${this.note}${event.emoji.native}`;
    this.isEmojiPickerVisible = false;
  }

  postNote() {
    this.navigation.saveNote(this.note);
  }

  onCancel() {
    this.note = '';
    this.location.back();
  }

  // public addLink() {
  //   if (this.data.note == '') {
  //     this.data.note = `${this.data.note}${"[title](url)"}`;
  //   }
  //   else {
  //     this.data.note = `${this.data.note}${" [title](url)"}`;
  //   }
  // }
}
