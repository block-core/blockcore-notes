import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { State } from '../services/state';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-example',
    templateUrl: 'example.html',
    styleUrls: ['example.css'],
    standalone: true,
    imports: [
      CommonModule,
      ScrollingModule,
      MatCardModule
    ]
})
export class ExampleComponent implements OnInit {
  @ViewChild('scrollViewport')
  private cdkVirtualScrollViewport: any;

  items = signal<string[]>(
    Array.from({ length: 10000 }).map((_, i) => `Item #${i + 1}`)
  );

  constructor(public state: State, private appState: ApplicationState) {}

  ngOnInit() {
    this.appState.updateTitle('Example');
  }

  calculateContainerHeight(): string {
    const numberOfItems = this.items().length;
    // This should be the height of your item in pixels
    const itemHeight = 20;
    // The final number of items you want to keep visible
    const visibleItems = 10;

    setTimeout(() => {
      // Makes CdkVirtualScrollViewport to refresh its internal size values after
      // changing the container height. This should be delayed with a "setTimeout"
      // because we want it to be executed after the container has effectively
      // changed its height.
      this.cdkVirtualScrollViewport.checkViewportSize();
    }, 300);

    // It calculates the container height for the first items in the list
    // It means the container will expand until it reaches `200px` (20 * 10)
    // and will keep this size.
    if (numberOfItems <= visibleItems) {
      return `${itemHeight * numberOfItems}px`;
    }

    // This function is called from the template so it ensures the container will have
    // the final height if number of items are greater than the value in "visibleItems".
    return `${itemHeight * visibleItems}px`;
  }
}
