// src/app/pages/asignaciones/asignaciones-ventas/asignaciones-ventas.component.ts
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { WithdrawalService, WithdrawalDto } from '../../../../../core/services/withdrawal.service';
import { SellDollarsService, SellDollar } from '../../../../../core/services/sell-dollars.service';

import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asignaciones-ventas',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    FormsModule
  ],
  templateUrl: './asignaciones-ventas.component.html',
  styleUrls: ['./asignaciones-ventas.component.css']
})
export class AsignacionesVentasComponent implements OnInit {
  // listado completo y filtrado
  allWithdrawals: Array<WithdrawalDto & { account: string }> = [];
  filteredWithdrawals: Array<WithdrawalDto & { account: string }> = [];

  // filtro por fecha
  startDate: Date | null = null;
  endDate: Date | null = null;

  // modal
  selected: (WithdrawalDto & { account: string }) | null = null;
  displayModal = false;
  saleRate: number | null = null;

  // cuentas a consultar
  private cuentas = ['MILTON', 'CESAR', 'MARCEL', 'SONIA'];

  constructor(
    private withdrawalService: WithdrawalService,
    private sellService: SellDollarsService
  ) {}

  ngOnInit(): void {
    this.loadWithdrawals();
  }

  loadWithdrawals() {
    const reqs = this.cuentas.map(acc =>
      this.withdrawalService.getWithdrawals(acc).pipe(
        map(arr => arr.map(w => ({ ...w, account: acc })))
      )
    );
    forkJoin(reqs).subscribe({
      next: lists => {
        this.allWithdrawals = lists.flat();
        this.filteredWithdrawals = [...this.allWithdrawals];
      },
      error: err => {
        console.error('Error cargando retiros', err);
        alert('No se pudieron cargar los retiros');
      }
    });
  }

  applyFilters() {
    this.filteredWithdrawals = this.allWithdrawals.filter(w => {
      const d = new Date(w.completeTime);
      return (!this.startDate || d >= this.startDate)
          && (!this.endDate   || d <= this.endDate);
    });
  }

  clearDateFilter() {
    this.startDate = this.endDate = null;
    this.filteredWithdrawals = [...this.allWithdrawals];
  }

  openAssignModal(w: WithdrawalDto & { account: string }) {
    this.selected = w;
    this.saleRate = null;
    this.displayModal = true;
  }

  closeModal() {
    this.displayModal = false;
    this.selected = null;
    this.saleRate = null;
  }

  saveSale() {
    if (!this.selected || !this.saleRate || this.saleRate <= 0) {
      alert('Ingrese una tasa válida');
      return;
    }
    const pesos = this.selected.amount * this.saleRate;
    const sell: SellDollar = {
      idWithdrawals: this.selected.id,
      tasa: this.saleRate,
      dollars: this.selected.amount,
      pesos:pesos,
      nameAccount: this.selected.account,
      date: new Date(this.selected.completeTime),
      supplierId: 1
    };
    this.sellService.createSellDollar(sell).subscribe({
      next: () => {
        alert('Venta asignada correctamente');
        this.closeModal();
        this.loadWithdrawals();
      },
      error: err => {
        console.error('Error guardando venta', err);
        alert('Error al guardar la venta');
      }
    });
  }
}
