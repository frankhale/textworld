import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfobarComponent } from './infobar.component';

describe('InfobarComponent', () => {
  let component: InfobarComponent;
  let fixture: ComponentFixture<InfobarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InfobarComponent]
    });
    fixture = TestBed.createComponent(InfobarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
