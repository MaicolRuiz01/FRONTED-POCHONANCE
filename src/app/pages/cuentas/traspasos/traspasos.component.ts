import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-traspasos',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './traspasos.component.html',
  styleUrls: ['./traspasos.component.css']
})
export class TraspasosComponent {
  cols: any[]= [];
      products: any[] = [];
      selectedProducts: any[]= [];

      constructor(private router: Router)   {}

      ngOnInit() {
        this.cols = [
          { field: 'date', header: 'Fecha' },
          { field: 'account', header: 'Cuenta Salida' },
          { field: 'account', header: 'Cuenta Entrada' },
          { field: 'currency', header: 'Red' },
          { field: 'fee', header: 'Valor' },
          { field: 'currency', header: 'Comision' },

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
