import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesComprap2pComponent } from './asignaciones-comprap2p.component';

describe('AsignacionesComprap2pComponent', () => {
  let component: AsignacionesComprap2pComponent;
  let fixture: ComponentFixture<AsignacionesComprap2pComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesComprap2pComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesComprap2pComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
