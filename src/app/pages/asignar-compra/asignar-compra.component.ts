import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-asignar-compra',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './asignar-compra.component.html',
  styleUrl: './asignar-compra.component.css'
})
export class AsignarCompraComponent {
    cols: any[]= [];
    products: any[] = [];
    selectedProducts: any[]= [];

    constructor(private router: Router)   {}

    ngOnInit() {
      this.cols = [
        { field: 'date', header: 'Fecha' },
        { field: 'account', header: 'Cuenta USDT' },
        { field: 'amount', header: 'Monto' },
        { field: 'fee', header: 'Tasa Compras' },
        { field: 'statement', header: 'Estado' },



      ];
 // Suponiendo que los productos contienen una propiedad 'account' para las cuentas
      this.products = [
        { orderNumber: 1, currency: 'USDT', fee: 0.1, date: '2023-01-01', amount: 10000 },
        { orderNumber: 2, currency: 'USDT', fee: 0.05, date: '2023-02-15', amount: 365000 },
        { orderNumber: 3,  currency: 'USDT', fee: 0.2, date: '2023-03-10', amount: 800000 }
      ];
      }

    onDateFilter(table: Table, event: Event) {
      const date = (event.target as HTMLInputElement).value;
      table.filter(date, 'date', 'equals');
    }
}
