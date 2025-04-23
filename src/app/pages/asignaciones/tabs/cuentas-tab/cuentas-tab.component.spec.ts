import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentasTabComponent } from './cuentas-tab.component';

describe('CuentasTabComponent', () => {
  let component: CuentasTabComponent;
  let fixture: ComponentFixture<CuentasTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentasTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentasTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
