import { Component, Input } from '@angular/core';
import { PostDocument } from '../../../../../../animiq-nip76-tools/dist/src';

@Component({
  selector: 'app-nip76-event-thread',
  templateUrl: './nip76-event-thread.component.html',
  styleUrls: ['./nip76-event-thread.component.scss']
})
export class Nip76EventThreadComponent {
  @Input()
  doc!: PostDocument;

}
