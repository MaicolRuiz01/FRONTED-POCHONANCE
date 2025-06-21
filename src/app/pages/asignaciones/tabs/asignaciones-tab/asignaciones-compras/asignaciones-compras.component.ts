import { Component, OnInit } from '@angular/core';
import { BuyDollarsService, BuyDollarsDto } from '../../../../../core/services/buy-dollars.service';
import { Supplier, SupplierService } from '../../../../../core/services/supplier.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-asignaciones-compras',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    CalendarModule,
    DropdownModule
  ],
  templateUrl: './asignaciones-compras.component.html',
  styleUrls: ['./asignaciones-compras.component.css']
})
export class AsignacionesComprasComponent implements OnInit {
  allDeposits: BuyDollarsDto[] = [];
  filteredDeposits: BuyDollarsDto[] = [];

  startDate: Date | null = null;
  endDate: Date | null = null;

  selectedDeposit: BuyDollarsDto | null = null;
  displayModal: boolean = false;
  purchaseRate: number | null = null;

  isRateInvalid: boolean = false;
  suppliers: Supplier[] = [];
  selectedSupplierId: number | null = null;

  constructor(private buyService: BuyDollarsService, private supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loadDeposits();
    this.loadSuppliers();
  }

  loadDeposits(): void {
    this.buyService.getAllEntradas().subscribe({
      next: data => {
        this.allDeposits = data;
        this.filteredDeposits = [...this.allDeposits];
      },
      error: err => {
        console.error('Error cargando depósitos', err);
        alert('No se pudieron cargar las compras');
      }
    });
  }
  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: data => this.suppliers = data,
      error: err => console.error('Error cargando proveedores', err)
    });
  }

  validateRate(): void {
    this.isRateInvalid = !this.purchaseRate || this.purchaseRate < 3500;
  }

  applyFilters(): void {
    this.filteredDeposits = this.allDeposits.filter(d => {
      const dt = new Date(d.date);
      return (!this.startDate || dt >= this.startDate)
          && (!this.endDate   || dt <= this.endDate);
    });
  }

  clearDateFilter(): void {
    this.startDate = null;
    this.endDate = null;
    this.filteredDeposits = [...this.allDeposits];
  }

  openAssignModal(deposit: BuyDollarsDto): void {
    this.selectedDeposit = deposit;
    this.purchaseRate = null;
    this.isRateInvalid = false;
    this.displayModal = true;
    this.selectedSupplierId = null;
  }

  closeModal(): void {
    this.displayModal = false;
    this.selectedDeposit = null;
    this.purchaseRate = null;
  }

  saveAssignment(): void {
    if (!this.selectedDeposit || !this.purchaseRate || !this.selectedSupplierId) return;

    const pesos = this.selectedDeposit.dollars * this.purchaseRate;

    const buyData: BuyDollarsDto = {
      dollars: this.selectedDeposit.dollars,
      tasa: this.purchaseRate,
      nameAccount: this.selectedDeposit.nameAccount,
      pesos: pesos,
      date: new Date(this.selectedDeposit.date),
      supplierId: this.selectedSupplierId,
      idDeposit: this.selectedDeposit.idDeposit
    };

    this.buyService.createBuyDollar(buyData).subscribe({
      next: () => {
        alert('Compra asignada correctamente');
        this.closeModal();
        this.loadDeposits();
      },
      error: err => {
        console.error('Error guardando compra', err);
        alert('Error al guardar la compra');
      }
    });
  }
}
