import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NavigationService } from '../services/navigation';
import { Location } from '@angular/common';
import { ApplicationState } from '../services/applicationstate';
import { BadgeDefinitionEvent, BlogEvent } from '../services/interfaces';
import { Event } from 'nostr-tools';
import { Subscription } from 'rxjs';
import { Utilities } from '../services/utilities';
import { QueueService } from '../services/queue.service';
import { ArticleService } from '../services/article';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from '../services/profile';
import { BadgeService } from '../services/badge';

export interface NoteDialogData {
  note: string;
}

@Component({
  selector: 'app-editor',
  templateUrl: 'editor.html',
  styleUrls: ['editor.css'],
})
export class EditorBadgesComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    image: ['', Validators.required],
    thumb: [''],
    slug: ['', Validators.required],
  });

  note: string = '';

  badge: BadgeDefinitionEvent = { name: '', description: '', image: '', thumb: '', slug: '' };

  title = '';

  summary = '';

  minDate?: number;

  eventType: string = 'badge';

  public dateControl = new FormControl(null);

  subscriptions: Subscription[] = [];

  constructor(
    private snackBar: MatSnackBar,
    public badgeService: BadgeService,
    private queueService: QueueService,
    private utilities: Utilities,
    private appState: ApplicationState,
    private location: Location,
    private fb: FormBuilder,
    public navigation: NavigationService,
    public profileService: ProfileService
  ) {}

  ngOnInit() {
    this.appState.updateTitle(`Create a badge design`);
    this.appState.showBackButton = true;
    this.appState.showLogo = true;
    this.appState.actions = [];

    this.minDate = Date.now();

    this.form.valueChanges.subscribe((value) => {
      this.updateBadge();
    });

    this.queueService.enque(this.appState.getPublicKey(), 'BadgeDefinition');

    this.subscriptions.push(
      this.form.controls.name.valueChanges.subscribe((text) => {
        if (text) {
          this.form.controls.slug.setValue(this.createSlug(text));
        }
      })
    );
  }

  selectedBadge: string = '';

  changedArticle() {
    const article = this.badgeService.getDefinition(this.selectedBadge!);

    if (!article) {
      this.form.reset();

      return;
    }

    if (article.name == null) {
      article.name = '';
    }

    if (article.image == null) {
      article.image = '';
    }

    if (article.thumb == null) {
      article.thumb = '';
    }

    if (article.description == null) {
      article.description = '';
    }

    this.form.setValue({
      name: article.name,
      description: article.description,
      image: article.image,
      thumb: article.thumb,
      slug: article.slug ? article.slug : '',
    });

    this.updateBadge();
  }

  updateBadge() {
    this.badge.name = this.form.controls.name.value!;
    this.badge.description = this.form.controls.description.value!;
    this.badge.slug = this.form.controls.slug.value!;
    this.badge.image = this.form.controls.image.value!;
    this.badge.thumb = this.form.controls.thumb.value!;
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  noteTypeChanged() {
    // Load all articles for the user when toggling.
    if (this.eventType == 'badge') {
      this.queueService.enque(this.appState.getPublicKey(), 'BadgeDefinition');
    }
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

  formatSlug() {
    this.form.controls.slug.setValue(this.createSlug(this.form.controls.slug.value!));
  }

  async onSubmitArticle() {
    const controls = this.form.controls;

    const blog: BadgeDefinitionEvent = {
      name: controls.name.value!,
      description: controls.description.value!,
      image: controls.image.value!,
      thumb: controls.thumb.value!,
      slug: controls.slug.value!,
    };

    await this.navigation.saveBadgeDefinition(blog);

    this.snackBar.open(`Badge design was published. Notes does not support viewing badge designs yet.`, 'Hide', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
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
