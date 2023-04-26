import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip76ChannelNotesComponent } from './nip76-channel-notes.component';

describe('Nip76ChannelNotesComponent', () => {
  let component: Nip76ChannelNotesComponent;
  let fixture: ComponentFixture<Nip76ChannelNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip76ChannelNotesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip76ChannelNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
