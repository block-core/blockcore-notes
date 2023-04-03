import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip76RsvpsSentComponent } from './nip76-rsvps-sent.component';

describe('Nip76RsvpsSentComponent', () => {
  let component: Nip76RsvpsSentComponent;
  let fixture: ComponentFixture<Nip76RsvpsSentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip76RsvpsSentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip76RsvpsSentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
