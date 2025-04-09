import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabAsignacionComponent } from './tab-asignacion.component';

describe('TabAsignacionComponent', () => {
  let component: TabAsignacionComponent;
  let fixture: ComponentFixture<TabAsignacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabAsignacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabAsignacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
