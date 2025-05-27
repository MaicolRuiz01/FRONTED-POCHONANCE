import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesVentaTrusComponent } from './asignaciones-venta-trus.component';

describe('AsignacionesVentaTrusComponent', () => {
  let component: AsignacionesVentaTrusComponent;
  let fixture: ComponentFixture<AsignacionesVentaTrusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesVentaTrusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesVentaTrusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
