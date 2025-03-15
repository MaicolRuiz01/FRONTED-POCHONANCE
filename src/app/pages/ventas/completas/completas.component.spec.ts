import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletasComponent } from './completas.component';

describe('CompletasComponent', () => {
  let component: CompletasComponent;
  let fixture: ComponentFixture<CompletasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompletasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
