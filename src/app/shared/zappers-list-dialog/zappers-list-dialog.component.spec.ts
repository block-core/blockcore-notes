import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZappersListDialogComponent } from './zappers-list-dialog.component';

describe('ZappersListDialogComponent', () => {
  let component: ZappersListDialogComponent;
  let fixture: ComponentFixture<ZappersListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZappersListDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZappersListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
