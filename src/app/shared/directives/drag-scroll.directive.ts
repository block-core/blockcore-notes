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

  private velocity = signal(0);
  private timestamp = signal(0);
  private frame = signal(0);
  private amplitude = signal(0);
  private target = signal(0);
  private timeConstant = 500;
  private animationActive = false;

  private velocityFactor = 0.5;
  private momentumMultiplier = 8;

  private suppressClick = signal(false);
  private clickThreshold = 3;


  private startPosition = signal(0);
  private clickStartTime = signal(0);

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.element.nativeElement.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const scrollAmount = e.deltaY || e.deltaX;
        this.element.nativeElement.scrollLeft += scrollAmount;
      }, { passive: false });


      const observer = new MutationObserver((mutations) => {
        this.preventElementDrag();
      });

      observer.observe(this.element.nativeElement, {
        childList: true,
        subtree: true
      });


      this.preventElementDrag();
    });
  }


  private preventElementDrag(): void {

    const images = this.element.nativeElement.querySelectorAll('img');
    images.forEach((img: HTMLImageElement) => {
      img.setAttribute('draggable', 'false');
      img.style.pointerEvents = 'none';
    });


    const headers = this.element.nativeElement.querySelectorAll('app-event-header');
    headers.forEach((header: HTMLElement) => {
      header.setAttribute('draggable', 'false');


      header.removeEventListener('dragstart', this.preventDragHandler);
      header.addEventListener('dragstart', this.preventDragHandler);
    });
  }


  private preventDragHandler = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  ngOnDestroy(): void {
    this.cancelAnimation();


    try {
      const headers = this.element.nativeElement.querySelectorAll('app-event-header');
      headers.forEach((header: HTMLElement) => {
        header.removeEventListener('dragstart', this.preventDragHandler);
      });
    } catch (error) {

    }
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


    this.startPosition.set(event.pageX);
    this.clickStartTime.set(Date.now());

    this.element.nativeElement.classList.add('active');
    this.startX.set(event.pageX);
    this.scrollLeft.set(this.element.nativeElement.scrollLeft);



    const target = event.target as HTMLElement;
    const isClickable =
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('mat-icon');

    if (!isClickable) {
      event.preventDefault();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (!this.isDown()) return;

    this.isDown.set(false);
    this.element.nativeElement.classList.remove('active');

    this.cancelAnimation();
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isDown()) return;

    this.isDown.set(false);
    this.element.nativeElement.classList.remove('active');


    const distance = Math.abs(event.pageX - this.startPosition());
    const timeElapsed = Date.now() - this.clickStartTime();


    const isClick = distance < 5 && timeElapsed < 300;


    if (isClick) {
      this.suppressClick.set(false);
      return;
    }


    if (this.isDragging() || this.moveDistance() >= this.clickThreshold) {

      if (distance > 10) {
        this.suppressClick.set(true);
      }

      this.cancelAnimation();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {

    if (this.suppressClick()) {
      event.stopPropagation();
      event.preventDefault();
      this.suppressClick.set(false);
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDown()) return;

    const x = event.pageX;
    const delta = x - this.startX();


    if (Math.abs(delta) > this.clickThreshold && !this.isDragging()) {
      this.isDragging.set(true);
    }

    const now = Date.now();
    const elapsed = now - this.timestamp();

    this.timestamp.set(now);

    const damping = 0.85;
    const currentScrollLeft = this.scrollLeft() - (delta * damping);
    this.element.nativeElement.scrollLeft = currentScrollLeft;

    this.startX.set(x);
    this.scrollLeft.set(this.element.nativeElement.scrollLeft);

    if (elapsed > 0) {
      const v = 0.6 * (1000 * delta / (1 + elapsed)) + 0.4 * this.velocity();
      this.velocity.set(v);
    }

    this.moveDistance.set(this.moveDistance() + Math.abs(delta));
  }

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

    if (this.isDragging() || this.moveDistance() >= this.clickThreshold) {
      this.suppressClick.set(true);
      event.preventDefault();

      this.cancelAnimation();
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDown() || event.touches.length !== 1) return;

    const x = event.touches[0].pageX;
    const delta = x - this.startX();

    if (Math.abs(delta) > 5 && !this.isDragging()) {
      this.isDragging.set(true);
    }

    const now = Date.now();
    const elapsed = now - this.timestamp();

    this.timestamp.set(now);

    const touchSpeedMultiplier = 1.0;
    const currentScrollLeft = this.scrollLeft() - (delta * touchSpeedMultiplier);
    this.element.nativeElement.scrollLeft = currentScrollLeft;

    this.startX.set(x);
    this.scrollLeft.set(this.element.nativeElement.scrollLeft);

    if (elapsed > 0) {
      const v = 0.6 * (1000 * delta / (1 + elapsed)) + 0.4 * this.velocity();
      this.velocity.set(v);
    }

    this.moveDistance.set(this.moveDistance() + Math.abs(delta));
  }

  private autoScroll(): void {
    const amplitude = this.velocity() * this.velocityFactor;
    const initialPosition = this.element.nativeElement.scrollLeft;

    const targetPosition = initialPosition - amplitude * this.momentumMultiplier;

    const maxScrollLeft = this.element.nativeElement.scrollWidth - this.element.nativeElement.clientWidth;
    const boundedTarget = Math.max(0, Math.min(targetPosition, maxScrollLeft));

    this.amplitude.set(boundedTarget - initialPosition);
    this.target.set(boundedTarget);
    this.timestamp.set(Date.now());

    this.animationActive = true;

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

    this.velocity.set(0);
  }
}
