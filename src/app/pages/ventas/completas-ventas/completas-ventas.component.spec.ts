import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletasVentasComponent } from './completas-ventas.component';

describe('CompletasVentasComponent', () => {
  let component: CompletasVentasComponent;
  let fixture: ComponentFixture<CompletasVentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletasVentasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompletasVentasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
