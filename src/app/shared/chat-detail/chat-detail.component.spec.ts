import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ChatDetailComponent} from './chat-detail.component';

describe('ChatDetailComponent', () => {
  let component: ChatDetailComponent;
  let fixture: ComponentFixture<ChatDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChatDetailComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
