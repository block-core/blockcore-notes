import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip76ChannelHeaderComponent } from './nip76-channel.component';

describe('Nip76ChannelHeaderComponent', () => {
  let component: Nip76ChannelHeaderComponent;
  let fixture: ComponentFixture<Nip76ChannelHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip76ChannelHeaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip76ChannelHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
