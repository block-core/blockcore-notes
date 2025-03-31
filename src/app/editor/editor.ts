import { Component, ViewChild, signal, effect } from '@angular/core';
import { FormBuilder, FormControl, UntypedFormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NavigationService } from '../services/navigation';
import { Location } from '@angular/common';
import { ApplicationState } from '../services/applicationstate';
import { BlogEvent, NostrEvent } from '../services/interfaces';
import { Event, Kind } from 'nostr-tools';
import { Subscription } from 'rxjs';
import { now, Utilities } from '../services/utilities';
import { QueueService } from '../services/queue.service';
import { ArticleService } from '../services/article';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from '../services/profile';
import { EventService } from '../services/event';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ContentEditorDirective } from '../shared/content-input-directive/content-input.directive';
import { ContentInputHeightDirective } from '../shared/content-input-directive/content-input-height.directive';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

@Component({
    selector: 'app-editor',
    templateUrl: 'editor.html',
    styleUrls: ['editor.css'],
    standalone: true,
    imports: [
      CommonModule,
      ReactiveFormsModule,
      FormsModule,
      MatCardModule,
      MatButtonModule,
      MatInputModule,
      MatIconModule,
      MatButtonToggleModule,
      MatSelectModule,
      MatTabsModule,
      MatDatepickerModule,
      MatNativeDateModule,
      ContentEditorDirective,
      ContentInputHeightDirective,
      PickerModule
    ]
})
export class EditorComponent {
  @ViewChild('picker') picker: unknown;
  @ViewChild('noteContent') noteContent?: FormControl;
  @ViewChild('articleContent') articleContent?: FormControl;

  isEmojiPickerVisible = signal<boolean | undefined>(undefined);
  note = signal<string>('');
  eventType = signal<string>('text');
  blog = signal<BlogEvent>({ title: '', content: '', tags: '' });
  event = signal<NostrEvent | undefined>(undefined);
  selectedArticle = signal<string>('');
  minDate = signal<number | undefined>(undefined);
  followingUsers = signal<string[]>([]);
  subscriptions = signal<Subscription[]>([]);

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
    published_at: [''],
  });

  public dateControl = new FormControl(null);

  constructor(
    private snackBar: MatSnackBar,
    public articleService: ArticleService,
    private queueService: QueueService,
    private utilities: Utilities,
    private appState: ApplicationState,
    private location: Location,
    private fb: FormBuilder,
    public navigation: NavigationService,
    public profileService: ProfileService,
    private eventService: EventService
  ) {
    // Set following users using signal
    this.followingUsers.set(this.profileService.following.map(follower => follower.name));
    
    // Create an effect to update the event when content changes
    effect(() => {
      const content = this.noteForm.get('content')?.value;
      this.updateEvent(content);
    });
  }

  ngOnInit() {
    this.appState.updateTitle(`Write a note`);
    this.appState.showBackButton = true;
    this.appState.showLogo = true;
    this.appState.actions = [];

    this.minDate.set(Date.now());

    const titleSub = this.articleForm.controls.title.valueChanges.subscribe((text) => {
      if (text) {
        this.articleForm.controls.slug.setValue(this.createSlug(text));
      }
    });
    
    const contentSub = this.noteForm.controls.content.valueChanges.subscribe((text) => {
      this.updateEvent(text);
    });
    
    this.subscriptions.update(subs => [...subs, titleSub, contentSub]);
  }

  updateEvent(content: string | null) {
    if (!content) {
      this.event.set(undefined);
      return;
    }
    
    const newEvent: NostrEvent = {
      contentCut: false,
      tagsCut: false,
      kind: Kind.Text,
      content: content,
      tags: [],
      created_at: now(),
      id: '',
      sig: '',
      pubkey: this.appState.getPublicKey(),
    };

    newEvent.tags = this.eventService.parseContentReturnTags(newEvent.content);
    this.event.set(newEvent);
  }

  noteTypeChanged() {
    // Load all articles for the user when toggling.
    if (this.eventType() === 'article') {
      this.queueService.enque(this.appState.getPublicKey(), 'Article');
    }
  }

  createSlug(input: string) {
    input = input.toLowerCase();
    input = input.replace(/[\s\W]+/g, '-');
    input = input.replace(/^-+|-+$/g, '');
    return input;
  }

  public addEmojiNote(event: { emoji: { native: any } }) {
    let startPos = (<any>this.noteContent).nativeElement.selectionStart;
    let value = this.noteForm.controls.content.value;

    let parsedValue = value?.substring(0, startPos) + event.emoji.native + value?.substring(startPos, value.length);
    this.noteForm.controls.content.setValue(parsedValue);
    this.isEmojiPickerVisible.set(false);

    (<any>this.noteContent).nativeElement.focus();
  }

  public addEmojiArticle(event: { emoji: { native: any } }) {
    let startPos = (<any>this.articleContent).nativeElement.selectionStart;
    let value = this.articleForm.controls.content.value;

    let parsedValue = value?.substring(0, startPos) + event.emoji.native + value?.substring(startPos, value.length);
    this.articleForm.controls.content.setValue(parsedValue);
    this.isEmojiPickerVisible.set(false);

    (<any>this.articleContent).nativeElement.focus();
  }
  
  changedArticle() {
    const article = this.articleService.get(this.selectedArticle()!);

    if (!article) {
      this.articleForm.reset();
      return;
    }

    const summary = article.summary ?? '';
    const image = article.image ?? '';
    const title = article.title ?? '';

    this.articleForm.setValue({
      content: article.content,
      title: title,
      summary: summary,
      image: image,
      slug: article.slug ? article.slug : '',
      tags: article.metatags ? article.metatags.toString() : '',
      published_at: article.published_at ? article.published_at.toString() : '',
    });
  }

  formatSlug() {
    this.articleForm.controls.slug.setValue(this.createSlug(this.articleForm.controls.slug.value!));
  }
  
  async onSubmitArticle() {
    const controls = this.articleForm.controls;

    const blog: BlogEvent = {
      content: controls.content.value!,
      title: controls.title.value!,
      summary: controls.summary.value!,
      image: controls.image.value!,
      slug: controls.slug.value!,
      tags: controls.tags.value!,
    };

    if (controls.published_at.value) {
      blog.published_at = Number(controls.published_at.value);
    }

    await this.navigation.saveArticle(blog);

    this.snackBar.open(`Article was published. Notes does not support viewing articles yet.`, 'Hide', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  onSubmitNote() {
    this.navigation.saveNote(this.noteForm.controls.content.value!);
  }

  postNote() {
    this.navigation.saveNote(this.note());
  }

  onCancel() {
    this.note.set('');
    this.location.back();
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions());
  }
}
