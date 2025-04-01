import { Directive, ElementRef, HostListener, NgZone, inject, signal, OnDestroy, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appDragScroll]',
  standalone: true
})
export class DragScrollDirective implements AfterViewInit, OnDestroy {
  private element = inject(ElementRef);
  private ngZone = inject(NgZone);

  private isDown = signal(false);
  private startX = signal(0);
  private scrollLeft = signal(0);
  private isDragging = signal(false);
  private startTime = signal(0);
  private moveDistance = signal(0);

  // Momentum scrolling variables
  private velocity = signal(0);
  private timestamp = signal(0);
  private frame = signal(0);
  private amplitude = signal(0);
  private target = signal(0);
  private timeConstant = 325; // ms - adjust for scroll momentum feel
  private animationActive = false;

  // Add this new property to track if we should suppress clicks
  private suppressClick = signal(false);
  private clickThreshold = 3; // Lower threshold to better differentiate clicks from drags

  ngAfterViewInit(): void {
    // Add passive event listener for smoother scrolling
    this.ngZone.runOutsideAngular(() => {
      this.element.nativeElement.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const scrollAmount = e.deltaY || e.deltaX;
        this.element.nativeElement.scrollLeft += scrollAmount;
      }, { passive: false });

      // Prevent default drag behavior on all images within the container
      const images = this.element.nativeElement.querySelectorAll('img');
      images.forEach((img: HTMLImageElement) => {
        img.setAttribute('draggable', 'false');
        img.style.pointerEvents = 'none';
      });

      // Also prevent drag on app-event-header components
      const headers = this.element.nativeElement.querySelectorAll('app-event-header');
      headers.forEach((header: HTMLElement) => {
        header.addEventListener('mousedown', (e: MouseEvent) => {
          // Only prevent default for left mouse button when we're intending to drag
          if (e.button === 0) {
            e.preventDefault();
          }
        });

        // Prevent drag start
        header.addEventListener('dragstart', (e: DragEvent) => {
          e.preventDefault();
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.cancelAnimation();

    this.isDown.set(true);
    this.startTime.set(Date.now());
    this.moveDistance.set(0);
    this.isDragging.set(false);
    this.suppressClick.set(false);
    this.timestamp.set(Date.now());
    this.velocity.set(0);

    this.element.nativeElement.classList.add('active');
    this.startX.set(event.pageX);
    this.scrollLeft.set(this.element.nativeElement.scrollLeft);

    // Prevent default behavior for drag scrolling
    event.preventDefault();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (!this.isDown()) return;

    this.isDown.set(false);
    this.element.nativeElement.classList.remove('active');

    // Start momentum scrolling if we were dragging
    if (this.isDragging()) {
      this.autoScroll();
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isDown()) return;

    this.isDown.set(false);
    this.element.nativeElement.classList.remove('active');

    // If just a click (no significant drag) allow event to propagate
    if (!this.isDragging() && this.moveDistance() < this.clickThreshold) {
      return;
    }

    // If we've dragged significantly, prevent the click event
    if (this.isDragging() || this.moveDistance() >= this.clickThreshold) {
      this.suppressClick.set(true);

      // Start momentum scrolling
      this.autoScroll();
    }
  }

  // Add a click event handler to prevent clicks after dragging
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.suppressClick()) {
      event.stopPropagation();
      event.preventDefault();
      this.suppressClick.set(false); // Reset for next interaction
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDown()) return;

    const x = event.pageX;
    const delta = x - this.startX();

    // If moved more than threshold, consider it a drag
    if (Math.abs(delta) > this.clickThreshold && !this.isDragging()) {
      this.isDragging.set(true);
      event.preventDefault(); // Prevent text selection when dragging
    }

    // Calculate velocity for momentum scrolling
    const now = Date.now();
    const elapsed = now - this.timestamp();

    // Update timestamp
    this.timestamp.set(now);

    // Calculate movement
    const currentScrollLeft = this.scrollLeft() - delta;
    this.element.nativeElement.scrollLeft = currentScrollLeft;

    // Update values for next move
    this.startX.set(x);
    this.scrollLeft.set(this.element.nativeElement.scrollLeft);

    // Calculate velocity (pixels/ms)
    if (elapsed > 0) {
      const v = 0.8 * (1000 * delta / (1 + elapsed)) + 0.2 * this.velocity();
      this.velocity.set(v);
    }

    // Track total distance moved for distinguishing clicks from drags
    this.moveDistance.set(this.moveDistance() + Math.abs(delta));
  }

  // Touch support with inertial scrolling
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;

    this.cancelAnimation();

    this.isDown.set(true);
    this.startTime.set(Date.now());
    this.moveDistance.set(0);
    this.isDragging.set(false);
    this.suppressClick.set(false);
    this.timestamp.set(Date.now());
    this.velocity.set(0);

    this.element.nativeElement.classList.add('active');
    this.startX.set(event.touches[0].pageX);
    this.scrollLeft.set(this.element.nativeElement.scrollLeft);
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.isDown()) return;

    this.isDown.set(false);
    this.element.nativeElement.classList.remove('active');

    // If we've dragged significantly, prevent any click
    if (this.isDragging() || this.moveDistance() >= this.clickThreshold) {
      this.suppressClick.set(true);
      event.preventDefault();

      // Start momentum scrolling
      this.autoScroll();
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDown() || event.touches.length !== 1) return;

    const x = event.touches[0].pageX;
    const delta = x - this.startX();

    // If moved more than threshold, consider it a drag
    if (Math.abs(delta) > 5 && !this.isDragging()) {
      this.isDragging.set(true);
    }

    // Calculate velocity for momentum scrolling
    const now = Date.now();
    const elapsed = now - this.timestamp();

    // Update timestamp
    this.timestamp.set(now);

    // Calculate movement - smoother for touch
    const currentScrollLeft = this.scrollLeft() - delta * 1.2; // Slightly faster for touch
    this.element.nativeElement.scrollLeft = currentScrollLeft;

    // Update values for next move
    this.startX.set(x);
    this.scrollLeft.set(this.element.nativeElement.scrollLeft);

    // Calculate velocity (pixels/ms)
    if (elapsed > 0) {
      const v = 0.8 * (1000 * delta / (1 + elapsed)) + 0.2 * this.velocity();
      this.velocity.set(v);
    }

    // Track total distance moved for distinguishing taps from drags
    this.moveDistance.set(this.moveDistance() + Math.abs(delta));
  }

  // Momentum scrolling with physics-based deceleration
  private autoScroll(): void {
    const amplitude = this.velocity() * 0.8; // Adjust amplitude for desired momentum
    const initialPosition = this.element.nativeElement.scrollLeft;
    const targetPosition = initialPosition - amplitude * 15; // Adjust multiplier for momentum distance

    this.amplitude.set(targetPosition - initialPosition);
    this.target.set(targetPosition);
    this.timestamp.set(Date.now());

    this.animationActive = true;

    // Run animation outside Angular for better performance
    this.ngZone.runOutsideAngular(() => {
      cancelAnimationFrame(this.frame());
      this.frame.set(requestAnimationFrame(() => this.autoScrollStep()));
    });
  }

  private autoScrollStep(): void {
    if (!this.animationActive) return;

    const elapsed = Date.now() - this.timestamp();
    const delta = -this.amplitude() * Math.exp(-elapsed / this.timeConstant);

    if (Math.abs(delta) > 0.5) {
      this.element.nativeElement.scrollLeft = this.target() + delta;
      this.frame.set(requestAnimationFrame(() => this.autoScrollStep()));
    } else {
      this.element.nativeElement.scrollLeft = this.target();
      this.cancelAnimation();
    }
  }

  private cancelAnimation(): void {
    this.animationActive = false;
    cancelAnimationFrame(this.frame());
  }
}
