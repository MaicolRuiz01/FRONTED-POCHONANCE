import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-ventas-generales',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './ventas-generales.component.html',
  styleUrl: './ventas-generales.component.css'
})
export class VentasGeneralesComponent {
cols: any[]= [];
  products: any[] = [];
  selectedProducts: any[]= [];

  constructor(private router: Router)   {}

  ngOnInit() {
    this.cols = [
      { field: 'date', header: 'Fecha' },
      { field: 'account', header: 'Cuenta' },
      { field: 'tradeType', header: 'Tipo' },
      { field: 'amount', header: 'Monto' },
      { field: 'buy', header: 'TC' },
      { field: 'sell', header: 'TV' },

    ];


  }

  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'date', 'equals');
  }


  onTradeTypeFilter(table: Table, event: Event) {
    const tradeType = (event.target as HTMLInputElement).value;
    table.filter(tradeType, 'tradeType', 'contains');
  }

  onAccountFilter(table: Table, event: Event) {
    const account = (event.target as HTMLInputElement).value;
    table.filter(account, 'account', 'contains');
  }

  onAccountNameFilter(table: Table, event: Event) {
    const accountName = (event.target as HTMLInputElement).value;
    table.filter(accountName, 'accountName', 'contains');
  }
}
