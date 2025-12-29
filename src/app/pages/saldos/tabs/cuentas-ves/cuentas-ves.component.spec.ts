import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentasVesComponent } from './cuentas-ves.component';

describe('CuentasVesComponent', () => {
  let component: CuentasVesComponent;
  let fixture: ComponentFixture<CuentasVesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentasVesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentasVesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
