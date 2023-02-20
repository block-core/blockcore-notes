import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NavigationService } from '../services/navigation';
import { Location } from '@angular/common';
import { ApplicationState } from '../services/applicationstate';
import { BlogEvent } from '../services/interfaces';
import { Event } from 'nostr-tools';
import { Subscription } from 'rxjs';
import { Utilities } from '../services/utilities';

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

  noteForm = this.fb.group({
    content: ['', Validators.required],
    expiration: [''],
    dateControl: [],
  });

  articleForm = this.fb.group({
    content: ['', Validators.required],
    title: ['', Validators.required],
    summary: [''],
    image: [''],
    slug: [''],
    tags: [''],
  });

  note: string = '';

  blog?: BlogEvent = { title: '', content: '', tags: '' };

  title = '';

  summary = '';

  minDate?: number;

  eventType: string = 'text';

  public dateControl = new FormControl(null);

  subscriptions: Subscription[] = [];

  constructor(private utilities: Utilities, private appState: ApplicationState, private location: Location, private fb: FormBuilder, public navigation: NavigationService) {}

  ngOnInit() {
    this.appState.updateTitle(`Write a note`);
    this.appState.showBackButton = true;
    this.appState.showLogo = true;
    this.appState.actions = [];

    this.minDate = Date.now();

    this.subscriptions.push(
      this.articleForm.controls.title.valueChanges.subscribe((text) => {
        if (text) {
          this.articleForm.controls.slug.setValue(this.createSlug(text));
        }
      })
    );
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  createSlug(input: string) {
    // convert input to lowercase
    input = input.toLowerCase();
    // replace spaces and punctuation with hyphens
    input = input.replace(/[\s\W]+/g, '-');
    // remove duplicate or trailing hyphens
    input = input.replace(/^-+|-+$/g, '');
    // return the slug
    return input;
  }

  public addEmoji(event: { emoji: { native: any } }) {
    // this.dateControl.setValue(this.dateControl.value + event.emoji.native);
    this.note = `${this.note}${event.emoji.native}`;
    this.isEmojiPickerVisible = false;
  }

  postBlog() {
    // this.formGroupBlog.controls.

    // this.profileForm.value

    console.log('BLOG:', this.blog);
    // this.navigation.saveNote(this.note);
  }

  formatSlug() {
    this.articleForm.controls.slug.setValue(this.createSlug(this.articleForm.controls.slug.value!));
  }

  onSubmitArticle() {
    const controls = this.articleForm.controls;

    const blog: BlogEvent = {
      content: controls.content.value!,
      title: controls.title.value!,
      summary: controls.summary.value!,
      image: controls.image.value!,
      slug: controls.slug.value!,
      tags: controls.tags.value!,
    };

    this.navigation.saveArticle(blog);
  }

  onSubmitNote() {
    this.navigation.saveNote(this.noteForm.controls.content.value!);
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
