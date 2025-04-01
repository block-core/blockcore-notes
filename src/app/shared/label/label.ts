import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LabelService } from 'src/app/services/label';
import { LabelPipe } from '../label.pipe';

@Component({
  selector: 'app-label',
  templateUrl: 'label.html',
  imports: [CommonModule, LabelPipe],
})
export class LabelComponent {
  @Input() labels: string[] = [];

  constructor(private labelService: LabelService) {}
}
