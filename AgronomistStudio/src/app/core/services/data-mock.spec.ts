import { TestBed } from '@angular/core/testing';

import { DataMock } from './data-mock';

describe('DataMock', () => {
  let service: DataMock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
