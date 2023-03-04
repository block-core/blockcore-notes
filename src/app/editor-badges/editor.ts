import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NavigationService } from '../services/navigation';
import { Location } from '@angular/common';
import { ApplicationState } from '../services/applicationstate';
import { BadgeDefinitionEvent, BlogEvent, NostrBadgeDefinition } from '../services/interfaces';
import { Event } from 'nostr-tools';
import { Subscription } from 'rxjs';
import { Utilities } from '../services/utilities';
import { QueueService } from '../services/queue.service';
import { ArticleService } from '../services/article';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from '../services/profile';
import { BadgeService } from '../services/badge';
import { EventService } from '../services/event';

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

  badge: BadgeDefinitionEvent = { name: '', description: '', image: '', thumb: '', slug: '', hashtags: ['Collectible', 'Membership', 'Recognition'] };

  title = '';

  summary = '';

  minDate?: number;

  eventType: string = 'badge';

  public dateControl = new FormControl(null);

  subscriptions: Subscription[] = [];

  selectedBadge?: string = '';

  constructor(
    private snackBar: MatSnackBar,
    public badgeService: BadgeService,
    private queueService: QueueService,
    private utilities: Utilities,
    private appState: ApplicationState,
    private eventService: EventService,
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

    if (this.badgeService.selectedBadge) {
      this.selectedBadge = this.badgeService.selectedBadge.slug;
      this.changedArticle();
      this.badgeService.selectedBadge = undefined;
    }
  }

  changedArticle() {
    let badgeDefinition = this.badgeService.selectedBadge || this.badgeService.getDefinition(this.selectedBadge!);

    if (!badgeDefinition) {
      this.form.reset();
      this.badge.hashtags = ['Collectible', 'Membership', 'Recognition'];
      return;
    }

    if (badgeDefinition.name == null) {
      badgeDefinition.name = '';
    }

    if (badgeDefinition.image == null) {
      badgeDefinition.image = '';
    }

    if (badgeDefinition.thumb == null) {
      badgeDefinition.thumb = '';
    }

    if (badgeDefinition.description == null) {
      badgeDefinition.description = '';
    }

    this.form.setValue({
      name: badgeDefinition.name,
      description: badgeDefinition.description,
      image: badgeDefinition.image,
      thumb: badgeDefinition.thumb,
      slug: badgeDefinition.slug ? badgeDefinition.slug : '',
      // tags: badgeDefinition.metatags ? badgeDefinition.metatags.toString() : '',
    });

    this.updateBadge(badgeDefinition);
  }

  updateBadge(badgeDefinition?: NostrBadgeDefinition) {
    this.badge.name = this.form.controls.name.value!;
    this.badge.description = this.form.controls.description.value!;
    this.badge.slug = this.form.controls.slug.value!;
    this.badge.image = this.form.controls.image.value!;
    this.badge.thumb = this.form.controls.thumb.value!;

    if (badgeDefinition) {
      this.badge.hashtags = this.eventService.hashTags(badgeDefinition);
    }
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
      hashtags: this.badge.hashtags,
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
