import { Component, OnInit } from '@angular/core';
import { BuyDollarsService, BuyDollarsDto } from '../../../../../core/services/buy-dollars.service';

import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-asignaciones-trust',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    CalendarModule,
  ],
  templateUrl: './asignaciones-trust.component.html',
  styleUrls: ['./asignaciones-trust.component.css']
})
export class AsignacionesTrustComponent implements OnInit {

  allTrustTransactions: BuyDollarsDto[] = [];
  filteredTrustTransactions: BuyDollarsDto[] = [];

  startDate: Date | null = null;
  endDate: Date | null = null;

  selectedTransaction: BuyDollarsDto | null = null;
  displayModal: boolean = false;
  purchaseRate: number | null = null;

  constructor(private buyService: BuyDollarsService) {}

  ngOnInit(): void {
    this.loadTrustTransactions();
  }

  loadTrustTransactions(): void {
    this.buyService.getTrustTransactions().subscribe({
      next: (data: BuyDollarsDto[]) => {
        this.allTrustTransactions = data;
        this.filteredTrustTransactions = [...this.allTrustTransactions];
      },
      error: (err) => {
        console.error('Error cargando transacciones TRUST', err);
        alert('No se pudieron cargar las transacciones TRUST');
      }
    });
  }

  applyFilters(): void {
    this.filteredTrustTransactions = this.allTrustTransactions.filter(t => {
      const dt = new Date(t.date);
      return (!this.startDate || dt >= this.startDate)
          && (!this.endDate || dt <= this.endDate);
    });
  }

  clearDateFilter(): void {
    this.startDate = null;
    this.endDate = null;
    this.filteredTrustTransactions = [...this.allTrustTransactions];
  }

  openAssignModal(transaction: BuyDollarsDto): void {
    this.selectedTransaction = transaction;
    this.purchaseRate = null;
    this.displayModal = true;
  }

  closeModal(): void {
    this.displayModal = false;
    this.selectedTransaction = null;
    this.purchaseRate = null;
  }

  saveAssignment(): void {
    if (!this.selectedTransaction || !this.purchaseRate) return;

    const dto: BuyDollarsDto = {
      ...this.selectedTransaction,
      tasa: this.purchaseRate,
      pesos: this.selectedTransaction.dollars * this.purchaseRate,
      date: new Date(this.selectedTransaction.date),
      supplierId: 1,
      idDeposit: this.selectedTransaction.idDeposit
    };

    this.buyService.createBuyDollar(dto).subscribe({
      next: () => {
        alert('Compra TRUST asignada correctamente');
        this.closeModal();
        this.loadTrustTransactions();
      },
      error: err => {
        console.error('Error guardando compra TRUST', err);
        alert('Error al guardar la compra TRUST');
      }
    });
  }
}
