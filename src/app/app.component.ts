import { Component, OnInit, OnDestroy, signal, effect, inject, HostBinding } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApplicationState } from './services/applicationstate';
import { ThemeService } from './services/theme';
import { Utilities } from './services/utilities';
import { ProfileService } from './services/profile';
import { RelayService } from './services/relay';
import { Subscription } from 'rxjs';
import { UIService } from './services/ui';
import { NotificationsService } from './services/notifications';
import { MediaService } from './services/media';
import { OptionsService } from './services/options';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MediaPlayerComponent } from './shared/media-player/media-player';
import { SearchComponent } from './shared/search/search';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    MediaPlayerComponent,
    SearchComponent,
    TranslateModule
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  @HostBinding('class') className = '';
  
  title = signal<string>('');
  isDarkTheme = signal<boolean>(false);
  authenticated = signal<boolean>(false);
  subscriptions = signal<Subscription[]>([]);
  
  private theme = inject(ThemeService);
  private appState = inject(ApplicationState);
  private utilities = inject(Utilities);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private relayService = inject(RelayService);
  private ui = inject(UIService);
  private options = inject(OptionsService);
  private notificationService = inject(NotificationsService);
  public media = inject(MediaService);

  constructor() {
    effect(() => {
      this.className = this.theme.darkTheme() ? 'darkMode' : 'lightMode';
    });

    effect(() => {
      this.title.set(this.appState.title());
    });

    effect(() => {
      this.authenticated.set(this.appState.authenticated());
    });

    effect(() => {
      this.isDarkTheme.set(this.theme.darkTheme());
    });
  }

  ngOnInit() {
    // Setup theme change subscription
    const themeSubscription = this.theme.themeChanged.subscribe((darkTheme) => {
      this.isDarkTheme.set(darkTheme);
    });

    this.subscriptions.update(subs => [...subs, themeSubscription]);
  }

  logout() {
    // Stop the relay service
    this.relayService.stop();

    localStorage.setItem('blockcore:notes:nostr:pubkey', '');
    localStorage.setItem('blockcore:notes:nostr:prvkey', '');

    this.appState.clearIdentity();
    this.router.navigateByUrl('/connect');
  }

  menuOpened() {
    // Ensure the profile is updated
    this.profileService.ensureProfile();
  }

  toggleTheme() {
    this.theme.toggleDarkTheme();
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions());
  }
}
