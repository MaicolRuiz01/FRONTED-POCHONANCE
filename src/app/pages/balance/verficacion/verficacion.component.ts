import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-verficacion',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './verficacion.component.html',
  styleUrl: './verficacion.component.css'
})
export class VerficacionComponent {
 cols: any[]= [];
    products: any[] = [];
    selectedProducts: any[]= [];

    constructor(private router: Router)   {}

    ngOnInit() {
      this.cols = [
        { field: 'date', header: 'Fecha' },
        { field: 'sell', header: 'Venta' },
        { field: 'buyrate', header: 'T-C' },
        { field: 'sellrate', header: 'T-V' },
        { field: 'cx', header: 'Cx US' },
        { field: 'cuatrox', header: '4X' },
        { field: 'cripto', header: 'Cripto' },
        { field: 'dif', header: 'DIF' },

      ];

      this.products = [
        { date: '2025-03-01', sell: 1500, buyrate: 0.30, sellrate: 0.32, cx: 1.2, cuatrox: 4.8, cripto: 'Bitcoin', dif: 0.02 },
        { date: '2025-03-02', sell: 1600, buyrate: 0.31, sellrate: 0.33, cx: 1.3, cuatrox: 5.2, cripto: 'Ethereum', dif: 0.02 },
        { date: '2025-03-03', sell: 1550, buyrate: 0.29, sellrate: 0.31, cx: 1.1, cuatrox: 4.4, cripto: 'Ripple', dif: 0.02 },
        { date: '2025-03-04', sell: 1580, buyrate: 0.28, sellrate: 0.30, cx: 1.0, cuatrox: 4.0, cripto: 'Litecoin', dif: 0.02 },
        { date: '2025-03-05', sell: 1620, buyrate: 0.32, sellrate: 0.34, cx: 1.4, cuatrox: 5.6, cripto: 'Cardano', dif: 0.02 }
      ];

      }


    onDateFilter(table: Table, event: Event) {
      const date = (event.target as HTMLInputElement).value;
      table.filter(date, 'date', 'equals');
    }
}
