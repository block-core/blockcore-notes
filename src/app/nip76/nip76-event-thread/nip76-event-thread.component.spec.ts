import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip76EventThreadComponent } from './nip76-event-thread.component';

describe('Nip76EventThreadComponent', () => {
  let component: Nip76EventThreadComponent;
  let fixture: ComponentFixture<Nip76EventThreadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip76EventThreadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip76EventThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
