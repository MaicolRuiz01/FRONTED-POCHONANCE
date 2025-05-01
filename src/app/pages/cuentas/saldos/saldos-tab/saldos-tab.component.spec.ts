import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaldosTabComponent } from './saldos-tab.component';

describe('SaldosTabComponent', () => {
  let component: SaldosTabComponent;
  let fixture: ComponentFixture<SaldosTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaldosTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaldosTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
