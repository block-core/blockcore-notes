import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateThreadsComponent } from './private-threads.component';

describe('PrivateThreadsComponent', () => {
  let component: PrivateThreadsComponent;
  let fixture: ComponentFixture<PrivateThreadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivateThreadsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivateThreadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
