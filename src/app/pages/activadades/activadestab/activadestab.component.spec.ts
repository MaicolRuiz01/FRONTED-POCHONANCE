import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivadestabComponent } from './activadestab.component';

describe('ActivadestabComponent', () => {
  let component: ActivadestabComponent;
  let fixture: ComponentFixture<ActivadestabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivadestabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivadestabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
