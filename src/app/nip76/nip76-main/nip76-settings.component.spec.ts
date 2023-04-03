import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip76MainComponent } from './nip76-settings.component';

describe('PrivateThreadsComponent', () => {
  let component: Nip76MainComponent;
  let fixture: ComponentFixture<Nip76MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip76MainComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip76MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
