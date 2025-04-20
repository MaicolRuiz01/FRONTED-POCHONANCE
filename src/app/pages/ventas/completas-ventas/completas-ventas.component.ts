import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-completas-ventas',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './completas-ventas.component.html',
  styleUrl: './completas-ventas.component.css'
})
export class CompletasVentasComponent {
  cols: any[] = [];
  products: any[] = [];
  selectedProducts: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.cols = [
      { field: 'date', header: 'Fecha' },
      { field: 'account', header: 'Cuenta USDT' },
      { field: 'amount', header: 'Monto' },
      { field: 'fee', header: 'Tasa Venta' },  // Columna editable
      { field: 'wallet', header: 'Wallet' },
      { field: 'fase', header: 'Estado' },
    ];

    this.products = [
      { orderNumber: 1, account: 'Main Account', wallet: 'Milton El curioso', currency: 'USDT', fee: 0.1, date: '2023-01-01' },
      { orderNumber: 2, account: 'Savings Account', wallet: 'Mr Polanias', currency: 'USDT', fee: 0.05, date: '2023-02-15' },
      { orderNumber: 3, account: 'Main Account', wallet: 'Manosea enanas', currency: 'USDT', fee: 0.2, date: '2023-03-10' }
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
