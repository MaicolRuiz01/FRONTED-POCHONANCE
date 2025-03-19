import { ComponentFixture, TestBed } from '@angular/core/testing';

import { P2pAsignarComponent } from './p2p-asignar.component';

describe('P2pAsignarComponent', () => {
  let component: P2pAsignarComponent;
  let fixture: ComponentFixture<P2pAsignarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [P2pAsignarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(P2pAsignarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
