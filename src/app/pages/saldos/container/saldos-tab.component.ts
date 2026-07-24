import { Component, ViewChild } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { SaldosComponent } from '../tabs/saldos-cuentas/saldos.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-saldos-tab',
  standalone: true,
  imports: [SharedModule, SaldosComponent],
  templateUrl: './saldos-tab.component.html',
  styleUrls: ['./saldos-tab.component.css']
})
export class SaldosTabComponent {

  @ViewChild('saldosComp') saldosComp!: SaldosComponent;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'cuentas-cop') {
        // Entra directo a la vista de cuentas COP (no al hub).
        setTimeout(() => this.saldosComp?.verCop());
      }
    });
  }
}
