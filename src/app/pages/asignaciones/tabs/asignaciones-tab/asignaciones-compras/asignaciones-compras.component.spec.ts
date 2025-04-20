import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesComprasComponent } from './asignaciones-compras.component';

describe('AsignacionesComprasComponent', () => {
  let component: AsignacionesComprasComponent;
  let fixture: ComponentFixture<AsignacionesComprasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesComprasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesComprasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
