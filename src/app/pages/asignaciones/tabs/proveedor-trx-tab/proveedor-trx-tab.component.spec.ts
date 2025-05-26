import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedorTRXTabComponent } from './proveedor-trx-tab.component';

describe('ProveedorTRXTabComponent', () => {
  let component: ProveedorTRXTabComponent;
  let fixture: ComponentFixture<ProveedorTRXTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorTRXTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedorTRXTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
