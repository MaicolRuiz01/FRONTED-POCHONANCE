import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesTrustComponent } from './asignaciones-trust.component';

describe('AsignacionesTrustComponent', () => {
  let component: AsignacionesTrustComponent;
  let fixture: ComponentFixture<AsignacionesTrustComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesTrustComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesTrustComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
