import { Directive, HostListener, Output, EventEmitter, Input, ElementRef, OnInit } from '@angular/core';

// TODO: Make sure this doesn't trigger two in a row, do some distinct on the scroll position or 
// at least some delay.

export interface Viewport {
  h: number;
  w: number;
}

export type InfiniteScrollContext = 'self' | 'document';

@Directive({
  selector: '[infiniteScroll]',
})
export class InfiniteScrollDirective implements OnInit {
  el: any;
  viewport: Viewport;
  canTriggerAction: boolean = true;

  @Input() infiniteScrollContext: InfiniteScrollContext = 'self';
  @Output() scrollAction: EventEmitter<any> = new EventEmitter();
  @HostListener('scroll', ['$event']) onElementScroll() {
    if (this.infiniteScrollContext === 'self') {
      if (this.elementEndReachedInSelfScrollbarContext() && this.canTriggerAction) {
        this.triggerAction();
      }
    }
  }

  constructor(private element: ElementRef) {
    this.el = element.nativeElement;
    this.viewport = this.getViewport(window);
  }

  ngOnInit() {
    if (this.infiniteScrollContext === 'document') {
      document.addEventListener('scroll', () => {
        if (this.elementEndReachedInDocumentScrollbarContext(window, this.el) && this.canTriggerAction) {
          this.triggerAction();
        }
      });
    }
  }

  triggerAction() {
    this.canTriggerAction = false;
    this.scrollAction.emit(null);
  }

  elementEndReachedInSelfScrollbarContext(): boolean {
    // Add a margin of 1 pixels due to sometimes 1 pixel "missing" in vertical browser mode.
    if (this.el.scrollTop + this.el.offsetHeight >= this.el.scrollHeight - 1) {
      this.canTriggerAction = true;
      return true;
    }

    return false;
  }

  elementEndReachedInDocumentScrollbarContext(win: Window, el: any): boolean {
    const rect = el.getBoundingClientRect();
    const elementTopRelativeToViewport = rect.top;
    const elementTopRelativeToDocument = elementTopRelativeToViewport + win.pageYOffset;
    const scrollableDistance = el.offsetHeight + elementTopRelativeToDocument;
    const currentPos = win.pageYOffset + this.viewport.h;

    if (currentPos > scrollableDistance) {
      this.canTriggerAction = true;
      return true;
    }

    return false;
  }

  private getViewport(win: Window): Viewport {
    // This works for all browsers except IE8 and before
    if (win.innerWidth != null) {
      return {
        w: win.innerWidth,
        h: win.innerHeight,
      };
    }

    // For IE (or any browser) in Standards mode
    let d = win.document;

    if (document.compatMode == 'CSS1Compat') {
      return {
        w: d.documentElement.clientWidth,
        h: d.documentElement.clientHeight,
      };
    }

    // For browsers in Quirks mode
    return {
      w: d.body.clientWidth,
      h: d.body.clientHeight,
    };
  }
}
