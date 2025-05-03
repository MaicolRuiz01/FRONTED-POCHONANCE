import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-completada',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './completada.component.html',
  styleUrls: ['./completada.component.css']
})
export class CompletadaComponent {
  cols: any[] = [];
  products: any[] = [];
  selectedProducts: any[] = [];
  expandedRows: { [key: number]: boolean } = {};
  dropdownOptions: any[] = [];
  selectedOption: any;

  constructor(private router: Router) {}

  ngOnInit() {
    this.cols = [
      { field: 'date', header: 'Fecha' },
      { field: 'sell', header: 'Moneda' },


    ];

    this.products = [
      { id: 1, date: '2025-03-01', sell: 1500, buyrate: 0.30, sellrate: 0.32, cx: 1.2 },
      { id: 2, date: '2025-03-02', sell: 1600, buyrate: 0.31, sellrate: 0.33, cx: 1.3 },
      { id: 3, date: '2025-03-03', sell: 1550, buyrate: 0.29, sellrate: 0.31, cx: 1.1 },
      { id: 4, date: '2025-03-04', sell: 1580, buyrate: 0.28, sellrate: 0.30, cx: 1.0 },
      { id: 5, date: '2025-03-05', sell: 1620, buyrate: 0.32, sellrate: 0.34, cx: 1.4 }
    ];


  }


// Función corregida para alternar el dropdown
toggleDropdown(rowIndex: number): void {
  // Cierra todos los demás dropdowns
  Object.keys(this.expandedRows).forEach(key => {
    const numericKey = Number(key); // Convertimos explícitamente a número
    if (numericKey !== rowIndex) {
      this.expandedRows[numericKey] = false;
    }
  });

  // Abre/cierra el dropdown actual
  this.expandedRows[rowIndex] = !this.expandedRows[rowIndex];
}

getRandomValue(): string {
  // Devuelve un valor aleatorio entre 0 y 100 con 2 decimales
  return (Math.random() * 100).toFixed(2);
}

  // Función para filtrar por moneda
  onCurrencyFilter(table: Table, event: Event) {
    const currency = (event.target as HTMLInputElement).value;
    table.filter(currency, 'sell', 'contains');
  }

  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'date', 'equals');
  }
}
