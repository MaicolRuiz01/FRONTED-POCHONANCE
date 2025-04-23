import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesVentasComponent } from './asignaciones-ventas.component';

describe('AsignacionesVentasComponent', () => {
  let component: AsignacionesVentasComponent;
  let fixture: ComponentFixture<AsignacionesVentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesVentasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesVentasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
