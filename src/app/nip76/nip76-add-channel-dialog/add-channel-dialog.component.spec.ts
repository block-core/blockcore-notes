import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddChannelDialog } from './add-channel-dialog.component';

describe('AddChannelDialogComponent', () => {
  let component: AddChannelDialog;
  let fixture: ComponentFixture<AddChannelDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddChannelDialog ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddChannelDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
