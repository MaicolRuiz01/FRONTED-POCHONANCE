import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-trx',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './trx.component.html',
  styleUrl: './trx.component.css'
})
export class TrxComponent {
    cols: any[]= [];
    products: any[] = [];
    selectedProducts: any[]= [];

    constructor(private router: Router)   {}

    ngOnInit() {
      this.cols = [
        { field: 'date', header: 'Fecha' },
        { field: 'amount', header: 'Monto' },
        { field: 'fee', header: 'Tasa' },
        { field: 'currency', header: 'USDT' },



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
