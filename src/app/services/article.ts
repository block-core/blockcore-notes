import { Injectable } from '@angular/core';
import { ApplicationState } from './applicationstate';
import { EventService } from './event';
import { NostrArticle, NostrEvent } from './interfaces';
import { Utilities } from './utilities';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  articles: NostrArticle[] = [];

  constructor(private appState: ApplicationState, private utilities: Utilities, private eventService: EventService) {}

  get(slug: string) {
    return this.articles.find((a) => a.slug == slug);
  }

  put(event: NostrEvent) {
    const article = event as NostrArticle;
    article.slug = this.eventService.firstDTag(event);
    article.title = this.eventService.lastTagOfType(event, 'title');
    article.summary = this.eventService.lastTagOfType(event, 'summary');
    article.image = this.eventService.lastTagOfType(event, 'image');
    article.metatags = this.eventService.tagsOfTypeValues(event, 't');

    const publishedAt = this.eventService.lastTagOfType(event, 'published_at');

    if (publishedAt) {
      article.published_at = Number(publishedAt);
    }

    if (article.pubkey == this.appState.getPublicKey()) {
      const index = this.articles.findIndex((a) => a.slug == article.slug);

      if (index > -1) {
        const existing = this.articles[index];

        // If the existing is newer, ignore this article.
        if (existing.created_at > article.created_at) {
          return;
        }

        // Replace when newer.
        this.articles[index] = article;
      } else {
        this.articles.push(article);
      }
    } else {
      // TODO: We currently don't support lookup of others articles, when the time comes, update this.
      debugger;
    }
  }
}
