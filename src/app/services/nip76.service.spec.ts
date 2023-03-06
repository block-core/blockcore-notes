import { TestBed } from '@angular/core/testing';

import { Nip76Service } from './nip76.service';

describe('Nip76Service', () => {
  let service: Nip76Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Nip76Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
