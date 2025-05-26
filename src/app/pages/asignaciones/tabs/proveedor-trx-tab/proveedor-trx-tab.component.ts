import { Component, OnInit } from '@angular/core';
import { SpotOrdersService, SellDollarsDto } from '../../../../core/services/spot-orders.service';
import { SellDollarsService } from '../../../../core/services/sell-dollars.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-proveedor-trx-tab',
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
  templateUrl: './proveedor-trx-tab.component.html',
  styleUrl: './proveedor-trx-tab.component.css'
})
export class ProveedorTRXTabComponent implements OnInit {
  trades: SellDollarsDto[] = [];
  filteredTrades: SellDollarsDto[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;

  selectedTrade: SellDollarsDto | null = null;
  saleRate: number | null = null;
  displayModal = false;

  constructor(
    private spotOrdersService: SpotOrdersService,
    private sellDollarsService: SellDollarsService
  ) {}

  ngOnInit(): void {
    this.loadTrades();
  }

  loadTrades() {
    this.spotOrdersService.getTrades().subscribe({
      next: data => {
        this.trades = data;
        this.filteredTrades = [...this.trades];
      },
      error: err => {
        console.error('Error loading trades', err);
        alert('Error loading trades');
      }
    });
  }

  applyFilters() {
    this.filteredTrades = this.trades.filter(t => {
      const d = new Date(t.date);
      return (!this.startDate || d >= this.startDate) && (!this.endDate || d <= this.endDate);
    });
  }

  clearDateFilter() {
    this.startDate = this.endDate = null;
    this.filteredTrades = [...this.trades];
  }

  openAssignModal(trade: SellDollarsDto) {
    this.selectedTrade = trade;
    this.saleRate = null;
    this.displayModal = true;
  }

  closeModal() {
    this.displayModal = false;
    this.selectedTrade = null;
    this.saleRate = null;
  }

  saveSale() {
    if (!this.selectedTrade || !this.saleRate || this.saleRate <= 0) {
      alert('Ingrese una tasa válida');
      return;
    }

    const pesos = this.selectedTrade.dollars * this.saleRate;

    const sellDollar = {
      idWithdrawals: this.selectedTrade.idWithdrawals,
      tasa: this.saleRate,
      dollars: this.selectedTrade.dollars,
      pesos: pesos,
      nameAccount: this.selectedTrade.nameAccount,
      date: new Date(this.selectedTrade.date),
      supplierId: 1 // o el id que necesites
    };

    this.sellDollarsService.createSellDollar(sellDollar).subscribe({
      next: () => {
        alert('Venta asignada correctamente');
        this.closeModal();
        this.loadTrades();
      },
      error: err => {
        console.error('Error saving sale', err);
        alert('Error al guardar la venta');
      }
    });
  }
}
