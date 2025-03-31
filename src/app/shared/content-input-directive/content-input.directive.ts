import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Directive({
    selector: '[contentInput]',
    standalone: true
})
export class ContentEditorDirective {
  constructor(private el: ElementRef) {}
  
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    // Directive implementation
  }
}
