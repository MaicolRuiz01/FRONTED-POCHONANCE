import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VesConfigComponent } from './ves-config.component';

describe('VesConfigComponent', () => {
  let component: VesConfigComponent;
  let fixture: ComponentFixture<VesConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VesConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VesConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
