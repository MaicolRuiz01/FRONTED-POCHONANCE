import { Component, OnInit } from '@angular/core';
import { BalanceGeneral, BalanceGeneralService } from '../../../../core/services/balance-general.service';
import { DialogModule } from 'primeng/dialog';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { TableColumn } from '../../../../shared/mi-table/mi-table.component';
import { MiTableComponent } from '../../../../shared/mi-table/mi-table.component';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [DialogModule
    , CommonModule, TableModule, ButtonModule, CurrencyPipe, MiTableComponent
  ],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css'],
})
export class CajaComponent implements OnInit {
  balances: BalanceGeneral[] = [];
  showDetailsModal = false;
  showAdditionalInfoModal = false;
  selectedBalance: BalanceGeneral | null = null;

  totalCajaObj: Record<string, number> = {};
  totalCajaArr: { nombre: string; monto: number }[] = [];
  totalClientes: number = 0;

  columns: TableColumn[] = [
    { campo: 'date', columna: 'Fecha' },
    { campo: 'saldo', columna: 'Saldo' }
  ];

  constructor(private balanceService: BalanceGeneralService) { }

  ngOnInit() {
    this.loadBalances();
  }

  loadBalances(): void {
    this.balanceService.listar().subscribe({
      next: (data) => {
        this.balances = data;
      },
      error: (err) => {
        console.error('Error cargando balances', err);
      },
    });
  }

  showDetails(row: BalanceGeneral): void {
  // Buscar el registro completo en this.balances por id
  const full = this.balances.find(b => b.id === row.id);
  this.selectedBalance = full ?? row; // usa el completo si lo encuentra
  this.showDetailsModal = true;
}


  showAdditionalInfo(): void {
    // Llamada a totalCaja
    this.balanceService.totalCaja().subscribe({
      next: (data) => {
        this.totalCajaObj = data || {};
        this.totalCajaArr = Object.entries(this.totalCajaObj).map(([nombre, monto]) => ({
          nombre,
          monto: Number(monto ?? 0)
        }));
      },
      error: (err) => {
        console.error('Error cargando total caja', err);
      },
    });

    // Llamada a totalClientes
    this.balanceService.totalClientes().subscribe({
      next: (total) => {
        this.totalClientes = total;
        this.showAdditionalInfoModal = true; // Abrimos modal cuando llega el dato
      },
      error: (err) => {
        console.error('Error cargando total clientes', err);
        this.showAdditionalInfoModal = true;
      },
    });
  }

  closeModal(): void {
    this.showDetailsModal = false;
    this.showAdditionalInfoModal = false;
    this.selectedBalance = null;
  }
}
