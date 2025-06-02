import { Component, OnInit } from '@angular/core';
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
  allSales: SellDollar[] = [];
  filteredSales: SellDollar[] = [];

  startDate: Date | null = null;
  endDate: Date | null = null;

  selected: SellDollar | null = null;
  displayModal = false;
  saleRate: number | null = null;

  constructor(private sellService: SellDollarsService) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.sellService.getAllUnregisteredSales().subscribe({
      next: (sales) => {
        this.allSales = sales;
        this.filteredSales = [...this.allSales];
      },
      error: (err) => {
        console.error('Error cargando ventas', err);
        alert('No se pudieron cargar las ventas');
      }
    });
  }

  applyFilters(): void {
    this.filteredSales = this.allSales.filter(sale => {
      const saleDate = new Date(sale.date);
      return (!this.startDate || saleDate >= this.startDate) &&
             (!this.endDate || saleDate <= this.endDate);
    });
  }

  clearDateFilter(): void {
    this.startDate = this.endDate = null;
    this.filteredSales = [...this.allSales];
  }

  openAssignModal(sale: SellDollar): void {
    this.selected = sale;
    this.saleRate = null;
    this.displayModal = true;
  }

  closeModal(): void {
    this.displayModal = false;
    this.selected = null;
    this.saleRate = null;
  }

  saveSale(): void {
    if (!this.selected || !this.saleRate || this.saleRate <= 0) {
      alert('Ingrese una tasa válida');
      return;
    }
    const pesos = this.selected.dollars * this.saleRate;
    const sell: SellDollar = {
      ...this.selected,
      tasa: this.saleRate,
      pesos: pesos,
      supplierId: 1
    };
    this.sellService.createSellDollar(sell).subscribe({
      next: () => {
        alert('Venta asignada correctamente');
        this.closeModal();
        this.loadSales();
      },
      error: (err) => {
        console.error('Error guardando venta', err);
        alert('Error al guardar la venta');
      }
    });
  }
}