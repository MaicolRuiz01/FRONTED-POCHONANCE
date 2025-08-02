import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyTapComponent } from './buy-tap.component';

describe('BuyTapComponent', () => {
  let component: BuyTapComponent;
  let fixture: ComponentFixture<BuyTapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyTapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuyTapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
