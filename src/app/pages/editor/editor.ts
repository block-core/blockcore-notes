import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, Validators } from '@angular/forms';
import { NavigationService } from '../../services/navigation';
import { Location, CommonModule } from '@angular/common';
import { ApplicationState } from '../../services/applicationstate';
import { BlogEvent, NostrEvent } from '../../services/interfaces';
import { kinds } from 'nostr-tools';
import { Subscription } from 'rxjs';
import { now, Utilities } from '../../services/utilities';
import { TranslateModule } from '@ngx-translate/core';
import { QueueService } from '../../services/queue.service';
import { ArticleService } from '../../services/article';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfileService } from '../../services/profile';
import { EventService } from '../../services/event';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { EventComponent } from '../../shared/event/event';
import { ContentEditorDirective } from '../../shared/content-input-directive/content-input.directive';
import { MentionModule } from 'angular-mentions';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DateTimeComponent } from "../../shared/date-time/date-time.component";

export interface NoteDialogData {
  note: string;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    TranslateModule,
    MentionModule,
    MatButtonModule,
    CommonModule, MatSnackBarModule, PickerModule, EventComponent, ContentEditorDirective, ReactiveFormsModule, FormsModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    DateTimeComponent
],
  templateUrl: 'editor.html',
  styleUrls: ['editor.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent {
  @ViewChild('noteContent') noteContent?: FormControl;
  @ViewChild('articleContent') articleContent?: FormControl;

  eventType = new FormControl('text');

  isEmojiPickerVisible: boolean = false;
  isArticleEmojiPickerVisible: boolean = false;

  ArticleDateTimeValue: Date = new Date();
  NoteDateTimeValue: Date = new Date();

  minNoteDateValue: Date = new Date();
  minArticleDateValue: Date = new Date();

  ArticleLabel: string = 'DateTimeComponent.Label.Article';
  NoteLabel: string = 'DateTimeComponent.Label.Note';
  DateLabel: string = 'DateTimeComponent.DateLabel';
  TimeLabel: string = 'DateTimeComponent.TimeLabel';

  noteForm = this.fb.group({
    content: ['', Validators.required],
    expiration: [''],
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

  note: string = '';

  blog?: BlogEvent = { title: '', content: '', tags: '' };

  title = '';

  summary = '';

  minDate?: number;

  followingUsers : string [] = this.profileService.following.map(follower => follower.name);

  subscriptions: Subscription[] = [];

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
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

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

    this.subscriptions.push(
      this.noteForm.controls.content.valueChanges.subscribe((text) => {
        this.updateEvent(text);
      })
    );
  }

  handleNoteDateTimeChange(dateTime: Date | null): void {
    this.noteForm.patchValue({ expiration: dateTime?.toDateString() });
    this.cdr.detectChanges();
  }

  handleArticleDateTimeChange(dateTime: Date | null): void {
    this.articleForm.patchValue({ published_at: dateTime?.toDateString() });
    this.cdr.detectChanges();
  }

  updateEvent(content: string | null) {
    if (!content) {
      this.event = undefined;
    } else {
      this.event = {
        contentCut: false,
        tagsCut: false,
        kind: kinds.ShortTextNote,
        content: content ? content : '',
        tags: [],
        created_at: now(),
        id: '',
        sig: '',
        pubkey: this.appState.getPublicKey(),
      };

      this.event.tags = this.eventService.parseContentReturnTags(this.event.content);
    }
  }

  event?: NostrEvent;

  selectedArticle: string = '';

  changedArticle() {
    const article = this.articleService.get(this.selectedArticle!);

    if (!article) {
      this.articleForm.reset();

      return;
    }

    if (article.summary == null) {
      article.summary = '';
    }

    if (article.image == null) {
      article.image = '';
    }

    if (article.title == null) {
      article.title = '';
    }

    this.articleForm.setValue({
      content: article.content,
      title: article.title,
      summary: article.summary,
      image: article.image,
      slug: article.slug ? article.slug : '',
      tags: article.metatags ? article.metatags.toString() : '',
      published_at: article.published_at ? article.published_at.toString() : '',
    });
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  noteTypeChanged() {
    // Load all articles for the user when toggling.
    if (this.eventType.value == 'article') {
      this.queueService.enque(this.appState.getPublicKey(), 'Article');
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

  public addEmojiNote(event: { emoji: { native: any } }) {
    let startPos = (<any>this.noteContent).nativeElement.selectionStart;
    let value = this.noteForm.controls.content.value;

    let parsedValue = value?.substring(0, startPos) + event.emoji.native + value?.substring(startPos, value.length);
    this.noteForm.controls.content.setValue(parsedValue);
    this.isEmojiPickerVisible = false;

    (<any>this.noteContent).nativeElement.focus();
  }

  items: string[] = ['Noah', 'Liam', 'Mason', 'Jacob'];

  public addEmojiArticle(event: { emoji: { native: any } }) {
    let startPos = (<any>this.articleContent).nativeElement.selectionStart;
    let value = this.articleForm.controls.content.value;

    let parsedValue = value?.substring(0, startPos) + event.emoji.native + value?.substring(startPos, value.length);
    this.articleForm.controls.content.setValue(parsedValue);
    this.isEmojiPickerVisible = false;

    (<any>this.articleContent).nativeElement.focus();
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
