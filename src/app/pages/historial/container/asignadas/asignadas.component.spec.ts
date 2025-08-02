import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignadasComponent } from './asignadas.component';

describe('AsignadasComponent', () => {
  let component: AsignadasComponent;
  let fixture: ComponentFixture<AsignadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignadasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
