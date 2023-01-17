import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent {
  @Input() type: "online" | "busy" | "offline" = "online";
  @Input() text!: string;
}
