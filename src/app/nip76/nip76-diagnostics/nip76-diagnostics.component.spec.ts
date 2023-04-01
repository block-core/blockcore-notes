import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip76DiagnosticsComponent } from './nip76-diagnostics.component';

describe('Nip76DiagnosticsComponent', () => {
  let component: Nip76DiagnosticsComponent;
  let fixture: ComponentFixture<Nip76DiagnosticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip76DiagnosticsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip76DiagnosticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
