import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaVistaComponent } from './nueva-vista.component';

describe('NuevaVistaComponent', () => {
  let component: NuevaVistaComponent;
  let fixture: ComponentFixture<NuevaVistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaVistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaVistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
