import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContentDocument } from 'animiq-nip76-tools';
import { defaultSnackBarOpts } from '../nip76.service';

enum DiagType {
  Event = 'Event',
  Payload = 'Payload',
  Content = 'Content',
  Document = 'Document',
}

@Component({
  selector: 'app-nip76-diagnostics',
  templateUrl: './nip76-diagnostics.component.html',
  styleUrls: ['./nip76-diagnostics.component.scss']
})
export class Nip76DiagnosticsComponent {
  diagType = DiagType.Event;
  DiagTypeEnum = DiagType;
  delay = 190;
  includePrivateData = false;
  keepOpen = false;
  timer!: NodeJS.Timeout | undefined;
  @Input()
  doc!: ContentDocument
  @ViewChild('diagButton', { read: ElementRef })
  diagButton!: ElementRef;
  @ViewChild('diagCard', { read: ElementRef })
  diagCard!: ElementRef;

  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.diagType = DiagType.Event;
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.timer = setTimeout(() => {

      let x = this.diagButton.nativeElement.getBoundingClientRect().left + this.diagButton.nativeElement.offsetWidth / 2;
      let y = this.diagButton.nativeElement.getBoundingClientRect().top + this.diagButton.nativeElement.offsetHeight / 2;

      this.diagCard.nativeElement.style.display = 'block';
      this.diagCard.nativeElement.style.top = y + 'px';
      this.diagCard.nativeElement.style.left = (x - 600) + 'px';

      const diagHeight = 400;
      if (y + diagHeight > document.scrollingElement!.scrollHeight) {
        y = document.scrollingElement!.scrollHeight - diagHeight;
        this.diagCard.nativeElement.style.top = y + 'px';
      }

    }, this.delay)
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (!this.keepOpen)
      this.diagCard.nativeElement.style.display = 'none';
  }

  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  keyEventDown(event: KeyboardEvent) {
    if (event.ctrlKey) {
      this.includePrivateData = !this.includePrivateData;
    }
    if (event.shiftKey) {
      this.keepOpen = !this.keepOpen;
    }
  }

  prettierJson(forCopy = false): SafeHtml | string {
    const keys: string[] = [];
    const ignoreKeys = ['channelSubscription', 'documents'];
    const privateDataKeys = ['xpriv', "xpub", "wordset", "password", "signingKey", "cryptoKey"];
    const replacer = (k: string, v: any) => {
      if (this.diagType === DiagType.Document && ignoreKeys.includes(k)) {
        return undefined;
      }
      if (keys.indexOf(k) === -1) {
        keys.push(k);
      }
      if (v && !this.includePrivateData && privateDataKeys.includes(k)) {
        return '**MASKED**';
      }
      return v;
    };
    const obj = {
      'Event': this.doc.nostrEvent,
      'Payload': this.doc.payload,
      'Content': this.doc.content,
      'Document': this.doc,
    }[this.diagType] || {};
    let json = JSON.stringify(obj, replacer, 2);
    if (forCopy) {
      return json;
    } else {
      keys.forEach(k => {
        const regex = new RegExp(`"${k}":`, 'g');
        json = json.replace(regex, `"<b>${k}</b>":`);
      });
      return this.sanitizer.bypassSecurityTrustHtml(json);
    }
  }

  copyJson() {
    navigator.clipboard.writeText(this.prettierJson(true) as string);
    this.snackBar.open(`The JSON is copied into your clipboard.`, 'Hide', defaultSnackBarOpts);
  }
}
