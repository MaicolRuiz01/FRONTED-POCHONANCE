import { Component } from '@angular/core';
import { CajaComponent } from '../../../balance/caja/caja.component';
import { GastosComponent } from '../../../gastos/gastos.component';
import { SharedModule } from '../../../../shared/shared.module';
import { SaldosComponent } from '../saldos.component';

@Component({
  selector: 'app-saldos-tab',
  standalone: true,
  imports: [SharedModule, SaldosComponent, CajaComponent, GastosComponent],
  templateUrl: './saldos-tab.component.html',
  styleUrl: './saldos-tab.component.css'
})
export class SaldosTabComponent {

}
