import { Component } from '@angular/core';
import { CajaComponent } from '../tabs/balance/caja.component';
import { CajasComponent } from '../tabs/cajas/cajas.component';
import { SharedModule } from '../../../shared/shared.module';
import { SaldosComponent } from '../tabs/saldos-cuentas/saldos.component';
import { CuentasTabComponent } from '../tabs/cuentas-tab/cuentas-tab.component';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-saldos-tab',
  standalone: true,
  imports: [SharedModule, SaldosComponent, CajasComponent, CajaComponent, CuentasTabComponent],
  templateUrl: './saldos-tab.component.html',
  styleUrls: ['./saldos-tab.component.css']
})
export class SaldosTabComponent {

  selectedIndex = 0;

constructor(private route: ActivatedRoute) {}

ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    if (params['tab'] === 'cuentas-cop') {
      this.selectedIndex = 2; // índice del tab CUENTAS COP
    }
  });
}

}
