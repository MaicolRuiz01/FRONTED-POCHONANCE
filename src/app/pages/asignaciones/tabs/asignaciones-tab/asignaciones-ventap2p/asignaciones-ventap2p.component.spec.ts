import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesVentap2pComponent } from './asignaciones-ventap2p.component';

describe('AsignacionesVentap2pComponent', () => {
  let component: AsignacionesVentap2pComponent;
  let fixture: ComponentFixture<AsignacionesVentap2pComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesVentap2pComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesVentap2pComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
