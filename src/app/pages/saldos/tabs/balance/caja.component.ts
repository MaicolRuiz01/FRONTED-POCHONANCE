import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { Table } from 'primeng/table';
import { BalanceService, Balance, BalanceSaleP2PDto } from '../../../../core/services/balance.service';
import { TableModule } from 'primeng/table';
import {CardModule} from 'primeng/card';


@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [SharedModule,
    TableModule,
    CardModule
  ],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent implements OnInit {
  cols: any[] = [];
  balances: Balance[] = [];
  selectedProducts: any[] = [];

  showDateFilter: boolean = false; // controla visibilidad del filtro fecha
  today: string = ''; // fecha máxima permitida en formato yyyy-MM-dd

  displayModal: boolean = false;
  balanceSaleP2PData: BalanceSaleP2PDto | null = null;
  liveBalance: { date: string; saldo: number } | null = null;

  constructor(
    private router: Router,
    private balanceService: BalanceService
  ) {}

  ngOnInit() {
    this.loadBalances();

    this.cols = [
      { field: 'date', header: 'Fecha' },
      { field: 'saldo', header: 'Saldo' }
    ];

    // Obtener fecha hoy en formato yyyy-MM-dd para atributo max del input
    const now = new Date();
    this.today = now.toISOString().split('T')[0];

   this.loadLiveBalance();
  }

  loadLiveBalance(): void {
    this.balanceService.getLiveBalance().subscribe({
      next: (data) => {
        this.liveBalance = data;
      },
      error: (err) => {
        console.error('Error cargando balance en vivo', err);
      }
    });
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
    const input = event.target as HTMLInputElement;
    const date = input.value; // formato yyyy-MM-dd

    if (!date) {
      // Si el usuario borra la fecha, limpiar filtro
      table.clear();
      return;
    }

    // Confirmar con el usuario
    const confirmMsg = `¿Está seguro de generar un balance del ${new Date(date).toLocaleDateString()}?`;
    if (confirm(confirmMsg)) {
      // Filtrar solo si confirma
      table.filter(date, 'date', 'equals');
    } else {
      // Si cancela, limpiar la selección del input y filtro
      input.value = '';
      table.clear();
    }
  }

// TS - dentro de CajaComponent

showDetailsModal = false;
showAdvancedDetails = false;

// Datos para mostrar en el modal
detailsData: any[] = [];
advancedDetails: any[] = [];

get currentDetails() {
  return this.showAdvancedDetails ? this.advancedDetails : this.detailsData;
}

showDetails(product: Balance): void {
const fecha = new Date(product.date);
  const fechaLocal = fecha.toLocaleDateString('en-CA'); // Formato 'yyyy-MM-dd'

  this.balanceService.getBalanceSaleP2P(fechaLocal).subscribe({
    next: (data) => {
      this.balanceSaleP2PData = data;

      // Aquí asignamos los valores al detalle (solo etiqueta y valores que cambian)
      this.detailsData = [
        { label: 'TOTAL', value: data.total },               // Ajustar nombre variable segun objeto recibido
        { label: 'Vendidos', value: data.vendidos },
        { label: 'Comision USDT', value: data.comisionUsdt },
        { label: 'Impuestos COL', value: data.impuestosCol },
        { label: 'SALDO', value: data.saldo }                // SALDO nunca cambia
      ];

      this.advancedDetails = [
        { label: 'Tasa compra', value: data.tasaCompra },
        { label: 'Tasa venta', value: data.tasaVenta },
        { label: 'SALDO', value: data.saldo }                // SALDO fijo igual que arriba
      ];

      this.showAdvancedDetails = false;  // siempre abrir en resumen
      this.showDetailsModal = true;
    },
    error: (err) => {
      console.error('Error al obtener datos BalanceSaleP2P', err);
    }
  });
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
