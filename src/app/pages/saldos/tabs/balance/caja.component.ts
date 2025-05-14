import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { Table } from 'primeng/table';
import { BalanceService, Balance, BalanceSaleP2PDto } from '../../../../core/services/balance.service';


@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent implements OnInit{


  balances: Balance[] = []; // ← Lista real del backend

  displayModal: boolean = false;
  balanceSaleP2PData: BalanceSaleP2PDto | null = null;


  constructor(
    private router: Router,
    private balanceService: BalanceService // ⬅ nuevo
  ) {}

  ngOnInit() {
    this.loadBalances();

    this.cols = [
      { field: 'date', header: 'Fecha' },
      { field: 'saldo', header: 'Saldo' }
    ];
  }

  loadBalances(): void {
    this.balanceService.getAll().subscribe({
      next: (data) => {
        console.log('Datos de balance:', data);
        this.balances = data;
      },
      error: (err) => {
        console.error('Error cargando balances', err);
      }
    });
  }

  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'date', 'equals');
  }

showDetails(product: Balance): void {
  const fechaISO = product.date; // product.date debe ser string tipo ISO 'yyyy-MM-dd' o Date compatible

  this.balanceService.getBalanceSaleP2P(fechaISO).subscribe({
    next: (data) => {
      this.balanceSaleP2PData = data;
      this.displayModal = true;
    },
    error: (err) => {
      console.error('Error al obtener datos BalanceSaleP2P', err);
    }
  });
}






































  //de aqui en adelante son para elementos estaticos

  cols: any[] = [];
  products: any[] = [];
  statuses: any[] = [];
  selectedProducts: any[] = [];


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



  openMonthlyInfo() {
    this.displayModal = true;
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
