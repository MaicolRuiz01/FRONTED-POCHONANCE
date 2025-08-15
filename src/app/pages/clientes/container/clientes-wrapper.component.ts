import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ProveedorComponent } from '../tabs/proveedor-tab/proveedor.component';
import { ClientesComponent } from '../tabs/clientes-tab/clientes.component';



@Component({
  selector: 'app-clientes-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    ProveedorComponent,
    ClientesComponent
],
  templateUrl: './cliente-wrapper.component.html',
  styleUrls: ['./cliente-wrapper.component.css']
})
export class ClientesComponentW {
  tabIndex = 0;

}
