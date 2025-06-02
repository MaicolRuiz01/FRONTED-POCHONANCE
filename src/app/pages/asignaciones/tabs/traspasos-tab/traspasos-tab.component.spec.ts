import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraspasosTabComponent } from './traspasos-tab.component';

describe('TraspasosTabComponent', () => {
  let component: TraspasosTabComponent;
  let fixture: ComponentFixture<TraspasosTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraspasosTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TraspasosTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
