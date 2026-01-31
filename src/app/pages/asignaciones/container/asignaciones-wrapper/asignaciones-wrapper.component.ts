import { Component } from '@angular/core';
import { AsignacionesTabComponent } from '../../tabs/asignaciones-tab/asignaciones-tab.component';
import { CuentasTabComponent } from '../../../saldos/tabs/cuentas-tab/cuentas-tab.component';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { MovimientosComponent } from "../../tabs/cajas-tab/cajas-tab.component";
import { GastosComponent } from '../../gastos-tab/gastos-tab.component';
import { ContainerComponent } from '../../../cambios-arabes/container/container.component';

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
    ContainerComponent
],
  templateUrl: './asignaciones-wrapper.component.html',
  styleUrls: ['./asignaciones-wrapper.component.css']
})
export class AsignacionesWrapperComponent {
  tabIndex = 0;

}
