import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerficacionComponent } from './verficacion.component';

describe('VerficacionComponent', () => {
  let component: VerficacionComponent;
  let fixture: ComponentFixture<VerficacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerficacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerficacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
