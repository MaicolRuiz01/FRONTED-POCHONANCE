import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.css'
})
export class ComprasComponent {
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

    // Función para filtrar por cuenta
    onAccountFilter(table: Table, event: Event) {
    const account = (event.target as HTMLInputElement).value;
    table.filter(account, 'account', 'contains'); // Filtra solo por la propiedad 'account'
    }
    onDateFilter(table: Table, event: Event) {
      const date = (event.target as HTMLInputElement).value;
      table.filter(date, 'date', 'equals');
    }
}
