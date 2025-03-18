import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent {

  cols: any[] = [];
  products: any[] = [];
  statuses: any[] = [];
  selectedProducts: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.cols = [
      { field: 'date', header: 'Fecha' },
      { field: 'sell', header: 'Vendido' },
      { field: 'system', header: 'Sist' },
      { field: 'cripto', header: 'Cripto' },
      { field: 'expense', header: 'Gasto' },
      { field: 'remain', header: 'Restante' },
      { field: 'inventoryStatus', header: 'Saldo' }
  ];

    this.statuses = [
        { label: 'INSTOCK', value: 'instock' },
        { label: 'LOWSTOCK', value: 'lowstock' },
        { label: 'OUTOFSTOCK', value: 'outofstock' }
    ];
    // Simulación de productos con fechas
    this.products = [
        { date: new Date('2022-01-01'), sell: 'Laptop', price: 1500, category: 'Electronics', rating: 5, inventoryStatus: 'instock' },
        // Añade más productos según sea necesario
    ];
  }

  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'date', 'equals');
  }

}
