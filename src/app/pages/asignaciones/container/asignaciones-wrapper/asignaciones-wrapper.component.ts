import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AsignacionesTabComponent } from '../../tabs/asignaciones-tab/asignaciones-tab.component';
import { CuentasTabComponent } from '../../../saldos/tabs/cuentas-tab/cuentas-tab.component';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { MovimientosComponent } from "../../tabs/cajas-tab/cajas-tab.component";
import { GastosComponent } from '../../gastos-tab/gastos-tab.component';
import { ContainerComponent } from '../../../cambios-arabes/container/container.component';
import { VentasPendientesComponent } from '../../../p2p/tabs/ventas-pendientes/ventas-pendientes.component';
import { DeduccionesComponent } from '../../deducciones-tab/deducciones-tab.component';
import { AsignacionesComprap2pComponent } from '../../tabs/asignaciones-tab/asignaciones-comprap2p/asignaciones-comprap2p.component';

@Component({
  selector: 'app-asignaciones-wrapper',
  standalone: true,
  imports: [
    AsignacionesTabComponent,
    CuentasTabComponent,
    CommonModule,
    TabViewModule,
    MovimientosComponent,
    GastosComponent,
    ContainerComponent,
    VentasPendientesComponent,
    DeduccionesComponent,
    AsignacionesComprap2pComponent
],
  templateUrl: './asignaciones-wrapper.component.html',
  styleUrls: ['./asignaciones-wrapper.component.css']
})
export class AsignacionesWrapperComponent {
  tabIndex = 0;

  constructor(private router: Router) {}

  /** Vuelve al hub de Saldos (se entra a Asignar desde la card "Asignar"). */
  volverSaldos(): void {
    this.router.navigate(['/saldos']);
  }
}
