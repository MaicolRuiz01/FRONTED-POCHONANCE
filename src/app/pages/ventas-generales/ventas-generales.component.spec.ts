import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentasGeneralesComponent } from './ventas-generales.component';

describe('VentasGeneralesComponent', () => {
  let component: VentasGeneralesComponent;
  let fixture: ComponentFixture<VentasGeneralesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasGeneralesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentasGeneralesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
