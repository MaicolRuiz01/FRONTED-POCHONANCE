import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletadaComponent } from './completada.component';

describe('CompletadaComponent', () => {
  let component: CompletadaComponent;
  let fixture: ComponentFixture<CompletadaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletadaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompletadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
