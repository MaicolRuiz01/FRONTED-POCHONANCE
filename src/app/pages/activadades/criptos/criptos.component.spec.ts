import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriptosComponent } from './criptos.component';

describe('CriptosComponent', () => {
  let component: CriptosComponent;
  let fixture: ComponentFixture<CriptosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CriptosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CriptosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
