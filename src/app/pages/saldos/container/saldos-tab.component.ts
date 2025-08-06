import { Component } from '@angular/core';
import { CajaComponent } from '../tabs/balance/caja.component';
import { CajasComponent } from '../tabs/cajas/cajas.component';
import { GastosComponent } from '../tabs/gastos/gastos.component';
import { SharedModule } from '../../../shared/shared.module';
import { SaldosComponent } from '../tabs/saldos-cuentas/saldos.component';

@Component({
  selector: 'app-saldos-tab',
  standalone: true,
  imports: [SharedModule, SaldosComponent, CajasComponent, CajaComponent, GastosComponent],
  templateUrl: './saldos-tab.component.html',
  styleUrl: './saldos-tab.component.css'
})
export class SaldosTabComponent {

}
