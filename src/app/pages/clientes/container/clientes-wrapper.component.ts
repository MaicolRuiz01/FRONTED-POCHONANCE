import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProveedorComponent } from '../tabs/proveedor-tab/proveedor.component';
import { ClientesComponent } from '../tabs/clientes-tab/clientes.component';
import { ButtonModule } from 'primeng/button';
type ViewType = 'HOME' | 'CLIENTES' | 'PROVEEDORES';

@Component({
  selector: 'app-clientes-wrapper',
  standalone: true,
  imports: [CommonModule, ProveedorComponent, ClientesComponent,ButtonModule],
  templateUrl: './cliente-wrapper.component.html',
  styleUrls: ['./cliente-wrapper.component.css']
})
export class ClientesComponentW {

  view: ViewType = 'HOME'; // ✅ ya no arranca en CLIENTES

  clientesTotal = 0;
  proveedoresTotal = 0;

  abs(n: number) { return Math.abs(Number(n ?? 0)); }

  go(view: ViewType) { this.view = view; }
  back() { this.view = 'HOME'; }

  get clientesLabel() { return this.clientesTotal >= 0 ? 'Debemos' : 'Nos deben'; }
  get proveedoresLabel() { return this.proveedoresTotal >= 0 ? 'Debemos' : 'Nos deben'; }

  get clientesHint() {
    return this.clientesTotal >= 0 ? 'Total que debemos a clientes' : 'Total que clientes nos deben';
  }
  get proveedoresHint() {
    return this.proveedoresTotal >= 0 ? 'Total que debemos a proveedores' : 'Total que proveedores nos deben';
  }
  get totalGeneral(): number {
  return Number(this.clientesTotal ?? 0) + Number(this.proveedoresTotal ?? 0);
}

get totalGeneralLabel(): string {
  return this.totalGeneral >= 0 ? 'Debemos' : 'Nos deben';
}

get totalGeneralHint(): string {
  return this.totalGeneral >= 0
    ? 'Total que debemos en general'
    : 'Total que nos deben en general';
}

}
