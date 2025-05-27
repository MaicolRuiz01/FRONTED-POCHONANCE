import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesCompraTrustComponent } from './asignaciones-compra-trust.component';

describe('AsignacionesCompraTrustComponent', () => {
  let component: AsignacionesCompraTrustComponent;
  let fixture: ComponentFixture<AsignacionesCompraTrustComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesCompraTrustComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesCompraTrustComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
