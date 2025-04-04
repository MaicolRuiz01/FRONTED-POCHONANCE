import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-asignacion',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './asignacion.component.html',
  styleUrl: './asignacion.component.css'
})
export class AsignacionComponent {
  cols: any[]= [];
  products: any[] = [];
  selectedProducts: any[]= [];
  accordionHeaders = {
    compras: 'Compras',
    ventas: 'Ventas',
    p2p: 'P2P'
  };



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


    onDateFilter(table: Table, event: Event) {
      const date = (event.target as HTMLInputElement).value;
      table.filter(date, 'date', 'equals');
    }

    changeHeader(tab: 'compras' | 'ventas' | 'p2p') {
      this.accordionHeaders = { ...this.accordionHeaders, [tab]: 'Por Asignar' };
    }

    resetHeader(tab: 'compras' | 'ventas' | 'p2p') {
      this.accordionHeaders = { ...this.accordionHeaders, [tab]: this.capitalize(tab) };
    }

    capitalize(value: string): string {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }


}
