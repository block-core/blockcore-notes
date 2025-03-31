import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    selector: '[appAutoInputHeight]',
    standalone: false
})
export class ContentInputHeightDirective {
  @HostListener('input')
  onInput(): void {
    const e = this.element.nativeElement;

    if (e instanceof HTMLTextAreaElement) {
      const element: HTMLTextAreaElement = this.element.nativeElement;

      if (element.scrollHeight > element.clientHeight) {
        element.style.height = `${element.scrollHeight}px`;
      }
    }
  }

  constructor(private element: ElementRef) {}
}
