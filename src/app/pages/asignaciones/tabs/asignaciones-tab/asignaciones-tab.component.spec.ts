import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionesTabComponent } from './asignaciones-tab.component';

describe('AsignacionesTabComponent', () => {
  let component: AsignacionesTabComponent;
  let fixture: ComponentFixture<AsignacionesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionesTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
