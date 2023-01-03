import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public renderer: Renderer2;

  constructor(private _renderer: RendererFactory2) {
    this.renderer = _renderer.createRenderer(null, null);
  }

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
      this.renderer.addClass(document.body, 'dark');
      //   document.documentElement.classList.add('dark');
    } else {
      this.renderer.removeClass(document.body, 'dark');
      // document.documentElement.classList.remove('dark');
    }
  }
}
