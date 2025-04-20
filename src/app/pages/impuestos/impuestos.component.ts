import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-impuestos',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './impuestos.component.html',
  styleUrl: './impuestos.component.css'
})
export class ImpuestosComponent {
    cols: any[]= [];
    products: any[] = [];
    selectedProducts: any[]= [];

    constructor(private router: Router)   {}

    ngOnInit() {
      this.cols = [
        { field: 'date', header: 'Fecha' },
        { field: 'account', header: 'Cuenta' },
        { field: 'type', header: 'Tipo' },
        { field: 'amount', header: 'Monto' },
        { field: 'tip', header: 'Comisión' },

      ];
 // Suponiendo que los productos contienen una propiedad 'account' para las cuentas
      this.products = [
        { orderNumber: 1, account: 'Main Account', type: 'Pene', amount: 100, date: '2023-01-01', tip:  0.12},
        { orderNumber: 2, account: 'Savings Account', type: 'Traba', amount: 500, date: '2023-02-15', tip: 0.63 },
        { orderNumber: 3, account: 'Main Account', type: 'Enano', amount: 200, date: '2023-03-10', tip: 0.33 }
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
