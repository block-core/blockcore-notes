import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip76SettingsComponent } from './nip76-settings.component';

describe('PrivateThreadsComponent', () => {
  let component: Nip76SettingsComponent;
  let fixture: ComponentFixture<Nip76SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip76SettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip76SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
