import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip76AddInvitationComponent } from './nip76-add-invitation.component';

describe('Nip76AddInvitationComponent', () => {
  let component: Nip76AddInvitationComponent;
  let fixture: ComponentFixture<Nip76AddInvitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip76AddInvitationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip76AddInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
