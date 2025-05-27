import { Component, OnInit } from '@angular/core';
import { BuyDollarsDto, BuyDollarsService } from '../../../../../core/services/buy-dollars.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asignaciones-compra-trust',
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
  templateUrl: './asignaciones-compra-trust.component.html',
  styleUrl: './asignaciones-compra-trust.component.css'
})
export class AsignacionesCompraTrustComponent implements OnInit {
  buys: BuyDollarsDto[] = [];
  filteredBuys: BuyDollarsDto[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;

  selectedBuy: BuyDollarsDto | null = null;
  saleRate: number | null = null;
  displayModal = false;

  constructor(private buyDollarsService: BuyDollarsService) {}

  ngOnInit(): void {
    this.loadBuys();
  }

  loadBuys() {
    this.buyDollarsService.getUSDTEntradas().subscribe({
      next: data => {
        this.buys = data;
        this.filteredBuys = [...this.buys];
      },
      error: err => {
        console.error('Error loading buys', err);
        alert('Error loading buy transactions');
      }
    });
  }

  applyFilters() {
    this.filteredBuys = this.buys.filter(buy => {
      const d = new Date(buy.date);
      return (!this.startDate || d >= this.startDate) && (!this.endDate || d <= this.endDate);
    });
  }

  clearDateFilter() {
    this.startDate = this.endDate = null;
    this.filteredBuys = [...this.buys];
  }

  openAssignModal(buy: BuyDollarsDto) {
    this.selectedBuy = buy;
    this.saleRate = null;
    this.displayModal = true;
  }

  closeModal() {
    this.displayModal = false;
    this.selectedBuy = null;
    this.saleRate = null;
  }

  saveBuy() {
    if (!this.selectedBuy || !this.saleRate || this.saleRate <= 0) {
      alert('Ingrese una tasa válida');
      return;
    }

    const pesos = this.selectedBuy.dollars * this.saleRate;

    const buyDollarToSave: BuyDollarsDto = {
      ...this.selectedBuy,
      tasa: this.saleRate,
      pesos: pesos,
      supplierId: this.selectedBuy.supplierId || 1 // o ajusta según lógica
    };

    this.buyDollarsService.createBuyDollar(buyDollarToSave).subscribe({
      next: () => {
        alert('Compra asignada correctamente');
        this.closeModal();
        this.loadBuys();
      },
      error: err => {
        console.error('Error saving buy', err);
        alert('Error al guardar la compra');
      }
    });
  }
}
