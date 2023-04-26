import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip76DemoStarterComponent } from './nip76-demo-starter.component';

describe('LoginOrCreateNewComponent', () => {
  let component: Nip76DemoStarterComponent;
  let fixture: ComponentFixture<Nip76DemoStarterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip76DemoStarterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip76DemoStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
