import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddThreadDialog } from './add-thread-dialog.component';

describe('AddThreadDialogComponent', () => {
  let component: AddThreadDialog;
  let fixture: ComponentFixture<AddThreadDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddThreadDialog ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddThreadDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
