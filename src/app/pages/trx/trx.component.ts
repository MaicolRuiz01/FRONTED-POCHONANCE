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
        { field: 'account', header: 'Cuenta' },
        { field: 'currency', header: 'USDT' },
        { field: 'fee', header: 'Tasa' },
        { field: 'currency', header: 'Pesos' },

      ];
 // Suponiendo que los productos contienen una propiedad 'account' para las cuentas
      this.products = [
        { orderNumber: 1, account: 'Main Account', currency: 'USDT', fee: 0.1, date: '2023-01-01' },
        { orderNumber: 2, account: 'Savings Account', currency: 'USDT', fee: 0.05, date: '2023-02-15' },
        { orderNumber: 3, account: 'Main Account', currency: 'USDT', fee: 0.2, date: '2023-03-10' }
      ];
      }

    onDateFilter(table: Table, event: Event) {
      const date = (event.target as HTMLInputElement).value;
      table.filter(date, 'date', 'equals');
    }
}
