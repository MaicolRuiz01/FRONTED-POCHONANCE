import { Component, ViewChild } from '@angular/core';
import { CajaComponent } from '../tabs/balance/caja.component';
import { CajasComponent } from '../tabs/cajas/cajas.component';
import { SharedModule } from '../../../shared/shared.module';
import { SaldosComponent } from '../tabs/saldos-cuentas/saldos.component';
import { CuentasTabComponent } from '../tabs/cuentas-tab/cuentas-tab.component';
import { ActivatedRoute } from '@angular/router';
import { CuentasVesComponent } from '../tabs/cuentas-ves/cuentas-ves.component';
import { ClientesComponent } from '../../clientes/tabs/clientes-tab/clientes.component';
import { ClientesComponentW } from '../../clientes/container/clientes-wrapper.component';

@Component({
  selector: 'app-saldos-tab',
  standalone: true,
  imports: [SharedModule, SaldosComponent, CajasComponent, CajaComponent, CuentasTabComponent, CuentasVesComponent, ClientesComponent, ClientesComponentW],
  templateUrl: './saldos-tab.component.html',
  styleUrls: ['./saldos-tab.component.css']
})
export class SaldosTabComponent {

  @ViewChild('saldosComp')          saldosComp!: SaldosComponent;
  @ViewChild('clientesWrapperComp') clientesWrapperComp!: ClientesComponentW;

  selectedIndex = 0;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'cuentas-cop') {
        this.selectedIndex = 0; // pestaña CUENTAS
        // Abrir directamente la vista de cuentas COP (no el resumen).
        setTimeout(() => this.saldosComp?.verCop());
      }
    });
  }

  /** Clic en el header del tab CUENTAS: si estamos en una sub-vista, vuelve al resumen */
  onCuentasHeaderClick(): void {
    if (this.saldosComp && this.saldosComp.viewMode !== 'RESUMEN') {
      this.saldosComp.volverResumen();
    }
  }

  /** Clic en el header del tab CLIENTES: si hay sub-vista abierta, vuelve al HOME */
  onClientesHeaderClick(): void {
    if (this.clientesWrapperComp && this.clientesWrapperComp.view !== 'HOME') {
      this.clientesWrapperComp.goHome();
    }
  }
}
