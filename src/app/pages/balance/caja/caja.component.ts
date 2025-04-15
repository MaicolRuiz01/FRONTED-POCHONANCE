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
  displayModal: boolean = false;
  monthlyData: any[] = [
    { month: 'Enero', expense: 2000, soldUsdt: 15000, remaining: 13000, amount: 28000 },
    { month: 'Febrero', expense: 1500, soldUsdt: 18000, remaining: 16500, amount: 35000 }
    // Añade más datos según sea necesario
  ];

  //modal
  showDetailsModal = false;
  showAdvancedDetails = false;

  detailsData = [
    { label: 'VENTA', value: '123,456' },
    { label: 'CRIPTO', value: '678,910' },
    { label: 'GASTO', value: '11,213' },
    { label: 'SALDO', value: '824,213' }
  ];

  advancedDetails = [
    { label: 'USDT/peso', value: '18.90' },
    { label: 'Sistema', value: 'Binance' },
    { label: 'SALDO', value: '824,213' } // Se conserva
  ];



  constructor(private router: Router) {}

  ngOnInit() {
    this.cols = [
      { field: 'date', header: 'Fecha' },
      { field: 'inventoryStatus', header: 'Saldo' }
  ];

    this.statuses = [
        { label: 'INSTOCK', value: 'instock' },
        { label: 'LOWSTOCK', value: 'lowstock' },
        { label: 'OUTOFSTOCK', value: 'outofstock' }
    ];
    // Simulación de productos con fechas
    this.products = [
        { date: new Date('2022-01-01'), inventoryStatus: 'instock' },
        // Añade más productos según sea necesario
    ];
  }

  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'date', 'equals');
  }

  openMonthlyInfo() {
    this.displayModal = true;
  }

  showDetails() {
    this.showDetailsModal = true;
  }

  get currentDetails() {
    return this.showAdvancedDetails ? this.advancedDetails : this.detailsData;
  }

  onDetailsClicked() {
    this.showAdvancedDetails = true;
  }

  handleCloseOrBack() {
    if (this.showAdvancedDetails) {
      this.showAdvancedDetails = false;
    } else {
      this.showDetailsModal = false;
    }

  }
}
