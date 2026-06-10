import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentasVesComponent } from './ventas-ves.component';

describe('VentasVesComponent', () => {
  let component: VentasVesComponent;
  let fixture: ComponentFixture<VentasVesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasVesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentasVesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
