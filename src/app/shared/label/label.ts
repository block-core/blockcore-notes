import { Component, Input } from '@angular/core';
import { LabelService } from 'src/app/services/label';

@Component({
  selector: 'app-label',
  templateUrl: 'label.html',
})
export class LabelComponent {
  @Input() labels: string[] = [];

  constructor(private labelService: LabelService) {}
}
