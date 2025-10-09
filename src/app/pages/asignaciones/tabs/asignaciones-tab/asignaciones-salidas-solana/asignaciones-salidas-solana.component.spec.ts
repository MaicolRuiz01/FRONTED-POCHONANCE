import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesSalidasSolanaComponent } from './asignaciones-salidas-solana.component';

describe('AsignacionesSalidasSolanaComponent', () => {
  let component: AsignacionesSalidasSolanaComponent;
  let fixture: ComponentFixture<AsignacionesSalidasSolanaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesSalidasSolanaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesSalidasSolanaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
