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
        { field: 'amount', header: 'Monto' },
        { field: 'fee', header: 'Tasa' },
        { field: 'currency', header: 'Pesos' },
      ];

      this.products = [
        { orderNumber: 1, account: 'Main Account', amount: 1000, fee: 0.1, date: '2023-01-01', showButton: true },
        { orderNumber: 2, account: 'Savings Account', amount: 250000, fee: 0.05, date: '2023-02-15', showButton: true },
        { orderNumber: 3, account: 'Main Account', amount: 360000, fee: 0.2, date: '2023-03-10', showButton: true }
      ];
    }
    calculatePesos(product: any) {
      if (product.fee && product.amount) {
        product.currency = product.amount * product.fee; // Calcula el valor en pesos
        product.showButton = false; // Oculta el botón después del cálculo
      }
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
