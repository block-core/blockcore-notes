import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ArticleService } from '../services/article';
import { NostrArticle } from '../services/interfaces';

@Component({
    selector: 'app-articles',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        RouterModule
    ],
    template: `
        <div class="articles-container">
            <h1>Articles</h1>
            
            @if (isLoading()) {
                <div class="loading-container">
                    <mat-spinner></mat-spinner>
                </div>
            } @else if (error()) {
                <div class="error-message">
                    <p>{{ error() }}</p>
                    <button mat-raised-button color="primary" (click)="loadArticles()">Try Again</button>
                </div>
            } @else if (articles().length === 0) {
                <div class="no-articles">
                    <p>No articles found.</p>
                </div>
            } @else {
                <div class="articles-grid">
                    @for (article of articles(); track article.id) {
                        <mat-card class="article-card">
                            <mat-card-header>
                                <mat-card-title>{{ article.title }}</mat-card-title>
                                <mat-card-subtitle>By {{ article }} on {{ article.published_at| date }}</mat-card-subtitle>
                            </mat-card-header>
                            <mat-card-content>
                                <p>{{ article.summary || (article.content | slice:0:150) + '...' }}</p>
                            </mat-card-content>
                            <mat-card-actions>
                                <button mat-button color="primary" [routerLink]="['/article', article.id]">
                                    Read More
                                    <mat-icon>arrow_forward</mat-icon>
                                </button>
                            </mat-card-actions>
                        </mat-card>
                    }
                </div>
            }
        </div>`
    ,
    styles: `
        .article-card {
            margin-bottom: 16px;
        }
        
        .loading-container {
            display: flex;
            justify-content: center;
            padding: 32px;
        }
        
        .error-message {
            text-align: center;
            padding: 32px;
        }
        
        .no-articles {
            text-align: center;
            padding: 32px;
        }
    `
})
export class ArticlesComponent implements OnInit {
    articles = signal<NostrArticle[]>([]);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);
    articleService = inject(ArticleService);
    articlesCount = computed(() => this.articles().length);
    
    constructor() {
        // Use effect to log changes to the articles count
        effect(() => {
            console.log(`Articles count changed: ${this.articlesCount()}`);
        });
    }
    
    ngOnInit(): void {
        this.loadArticles();
    }
    
    async loadArticles(): Promise<void> {

        this.articles.set( this.articleService.articles);

        this.isLoading.set(true);
        this.error.set(null);
        
        // try {
        //     const response = await fetch('/api/articles');
            
        //     if (!response.ok) {
        //         throw new Error('Failed to load articles');
        //     }
            
        //     const data = await response.json();
        //     this.articles.set(data as Article[]);
        // } catch (err) {
        //     console.error('Error loading articles:', err);
        //     this.error.set(err instanceof Error ? err.message : 'An unexpected error occurred');
        // } finally {
        //     this.isLoading.set(false);
        // }
    }
}