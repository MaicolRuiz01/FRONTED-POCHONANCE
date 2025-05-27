import { Component, OnInit } from '@angular/core';
import { SellDollar, SellDollarsService } from '../../../../../core/services/sell-dollars.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asignaciones-venta-trus',
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
  templateUrl: './asignaciones-venta-trus.component.html',
  styleUrl: './asignaciones-venta-trus.component.css'
})
export class AsignacionesVentaTrusComponent implements OnInit {

  sells: SellDollar[] = [];
  filteredSells: SellDollar[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;

  selectedSell: SellDollar | null = null;
  saleRate: number | null = null;
  displayModal = false;

  constructor(private sellDollarsService: SellDollarsService) {}

  ngOnInit(): void {
    this.loadSells();
  }

  loadSells(): void {
    this.sellDollarsService.getUsdtSalidas().subscribe({
      next: (data: SellDollar[]) => {
        this.sells = data;
        this.filteredSells = [...this.sells];
      },
      error: (err) => {
        console.error('Error loading sales', err);
        alert('Error loading sales');
      }
    });
  }

  applyFilters(): void {
    this.filteredSells = this.sells.filter(sell => {
      const d = new Date(sell.date);
      return (!this.startDate || d >= this.startDate) && (!this.endDate || d <= this.endDate);
    });
  }

  clearDateFilter(): void {
    this.startDate = null;
    this.endDate = null;
    this.filteredSells = [...this.sells];
  }

  openAssignModal(sell: SellDollar): void {
    this.selectedSell = sell;
    this.saleRate = null;
    this.displayModal = true;
  }

  closeModal(): void {
    this.displayModal = false;
    this.selectedSell = null;
    this.saleRate = null;
  }

  saveSell(): void {
    if (!this.selectedSell || !this.saleRate || this.saleRate <= 0) {
      alert('Ingrese una tasa válida');
      return;
    }

    const pesos = this.selectedSell.dollars * this.saleRate;

    const sellToSave: SellDollar = {
      ...this.selectedSell,
      tasa: this.saleRate,
      pesos: pesos,
      supplierId: this.selectedSell.supplierId || 1
    };

    this.sellDollarsService.createSellDollar(sellToSave).subscribe({
      next: () => {
        alert('Venta asignada correctamente');
        this.closeModal();
        this.loadSells();
      },
      error: (err) => {
        console.error('Error saving sale', err);
        alert('Error al guardar la venta');
      }
    });
  }
}
