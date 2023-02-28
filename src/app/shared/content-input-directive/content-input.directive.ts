import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appContentEditor]',
})
export class ContentEditorDirective {
  @HostListener('input')
  onInput(): void {
    const e = this.element.nativeElement;

    if (e instanceof HTMLDivElement) {
      // TODO: Add future support for content editable div.
      console.warn('Unsupported HTML element type (HTMLDivElement) for content editor.');
      return;
    } else if (e instanceof HTMLTextAreaElement) {
      // Supported input type!
    } else {
      console.warn('Unsupported HTML element type for content editor.');
      return;
    }

    const element: HTMLTextAreaElement = this.element.nativeElement;

    const selectionStart = element.selectionStart;
    const selectionEnd = element.selectionEnd;
    const textInput = element.value;

    // console.log('selectionStart: ' + selectionStart);
    // console.log('selectionEnd: ' + selectionEnd);
    // console.log('textInput: ' + textInput);

    let token: string | undefined;

    // If we are at the end of text, it means user is typing at the end of the text and
    // we'll select the last character.
    if (textInput.length == selectionEnd) {
      token = textInput.at(-1);
    } else {
      token = textInput.substring(selectionStart - 1, selectionEnd);
    }

    // console.log('token: ' + token);

    if (token == '@') {
      // console.log('Mention');
    } else if (token == '#') {
      // console.log('Hashtag');
    }
  }

  constructor(private element: ElementRef) {}
}
