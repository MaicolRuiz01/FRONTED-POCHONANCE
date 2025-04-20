import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignarCompraComponent } from './asignar-compra.component';

describe('AsignarCompraComponent', () => {
  let component: AsignarCompraComponent;
  let fixture: ComponentFixture<AsignarCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarCompraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignarCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
