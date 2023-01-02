import { Injectable, Renderer2 } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {

    get darkMode(): boolean {
        if (localStorage.getItem('theme')) {
            if (localStorage.getItem('theme') === 'dark') {
                return true;
            }
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return true;
        }

        return false;
    }

    set darkMode(value: boolean) {
        if (value) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }

        this.updateMode();
    }

    public init() {
        this.updateMode();
    }

    private updateMode() {
        if (this.darkMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
    }
}
