import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellTabComponent } from './sell-tab.component';

describe('SellTabComponent', () => {
  let component: SellTabComponent;
  let fixture: ComponentFixture<SellTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
