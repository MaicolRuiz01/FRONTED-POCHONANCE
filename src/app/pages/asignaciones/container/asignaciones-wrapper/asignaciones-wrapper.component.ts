import { Component } from '@angular/core';
import { AsignacionesTabComponent } from '../../tabs/asignaciones-tab/asignaciones-tab.component';
import { CuentasTabComponent } from '../../tabs/cuentas-tab/cuentas-tab.component';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ProveedorTRXTabComponent } from '../../tabs/proveedor-trx-tab/proveedor-trx-tab.component';

@Component({
  selector: 'app-asignaciones-wrapper',
  standalone: true,
  imports: [
    AsignacionesTabComponent,
    CuentasTabComponent,
    CommonModule,
    TabViewModule,
    ProveedorTRXTabComponent
  ],
  templateUrl: './asignaciones-wrapper.component.html',
  styleUrl: './asignaciones-wrapper.component.css'
})
export class AsignacionesWrapperComponent {
  tabIndex = 0;

}
