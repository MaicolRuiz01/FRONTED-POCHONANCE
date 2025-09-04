import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdenesCriptoComponent } from './ordenes-cripto.component';

describe('OrdenesCriptoComponent', () => {
  let component: OrdenesCriptoComponent;
  let fixture: ComponentFixture<OrdenesCriptoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdenesCriptoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdenesCriptoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
