import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpcionesTabComponent } from './opciones-tab.component';

describe('OpcionesTabComponent', () => {
  let component: OpcionesTabComponent;
  let fixture: ComponentFixture<OpcionesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpcionesTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpcionesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
