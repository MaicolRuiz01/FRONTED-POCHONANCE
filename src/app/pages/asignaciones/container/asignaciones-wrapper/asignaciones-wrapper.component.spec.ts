import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesWrapperComponent } from './asignaciones-wrapper.component';

describe('AsignacionesWrapperComponent', () => {
  let component: AsignacionesWrapperComponent;
  let fixture: ComponentFixture<AsignacionesWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
