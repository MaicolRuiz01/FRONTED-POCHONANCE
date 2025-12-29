import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprasVesComponent } from './compras-ves.component';

describe('ComprasVesComponent', () => {
  let component: ComprasVesComponent;
  let fixture: ComponentFixture<ComprasVesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasVesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprasVesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
