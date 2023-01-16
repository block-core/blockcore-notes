import { Component, Inject, ViewChild } from '@angular/core';
import { FormControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface NoteDialogData {
  note: string;
}

@Component({
  selector: 'create-note-dialog',
  templateUrl: 'create-note-dialog.html',
  styleUrls: ['create-note-dialog.scss'],
})
export class NoteDialog {
  @ViewChild('picker') picker: unknown;

  isEmojiPickerVisible: boolean | undefined;

  formGroup!: UntypedFormGroup;

  minDate?: number;

  public dateControl = new FormControl(null);

  constructor(private formBuilder: UntypedFormBuilder, public dialogRef: MatDialogRef<NoteDialog>, @Inject(MAT_DIALOG_DATA) public data: NoteDialogData) {
    this.data.note = '';
  }

  ngOnInit() {
    this.minDate = Date.now();

    this.formGroup = this.formBuilder.group({
      note: ['', Validators.required],
      expiration: [''],
      dateControl: [],
    });
  }

  onNoClick(): void {
    this.data.note = '';
    this.dialogRef.close();
  }

  public addEmoji(event: { emoji: { native: any } }) {
    // this.dateControl.setValue(this.dateControl.value + event.emoji.native);
    this.data.note = `${this.data.note}${event.emoji.native}`;
    this.isEmojiPickerVisible = false;
  }

  // public addLink() {
  //   if (this.data.note == '') {
  //     this.data.note = `${this.data.note}${"[title](url)"}`;
  //   }
  //   else {
  //     this.data.note = `${this.data.note}${" [title](url)"}`;
  //   }
  // }

  largeSize = false;

  toggleSize() {
    if (this.largeSize) {
      this.dialogRef.updateSize('auto', 'auto');
    } else {
      this.dialogRef.updateSize('100vw', '100vh');
    }

    this.largeSize = !this.largeSize;

    // .full-width-dialog {
    //   max-width: 100vw !important;
    //   height: 100%;
    //   width: 100%;
    //   min-width: 0;
    // }
  }
}
