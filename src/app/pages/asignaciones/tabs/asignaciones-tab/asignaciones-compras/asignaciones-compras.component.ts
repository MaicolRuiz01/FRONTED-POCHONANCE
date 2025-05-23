import { Component, OnInit } from '@angular/core';
import { Observable,forkJoin } from 'rxjs';
import { DepositService } from '../../../../../core/services/deposit.service';
import { BuyDollarsService } from '../../../../../core/services/buy-dollars.service';
import { BuyDollarsDto } from '../../../../../core/services/buy-dollars.service';

import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { CalendarModule } from 'primeng/calendar';

export interface Deposit {
  dollars: number;
  tasa: number;
  nameAccount: string;
  date: string;
  idDeposit: string;
  pesos: number;

}

@Component({
  selector: 'app-asignaciones-compras',
  standalone: true,
  imports: [
    // módulos PrimeNG y Angular necesarios
    CommonModule,
    TableModule,
    DropdownModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    CalendarModule,
  ],
  templateUrl: './asignaciones-compras.component.html',
  styleUrls: ['./asignaciones-compras.component.css']
})
export class AsignacionesComprasComponent implements OnInit {
  // listado original y filtrado
  allDeposits: Deposit[] = [];
  filteredDeposits: Deposit[] = [];

  // opciones de filtro (PrimeNG Dropdown)
  accountFilterOptions: { label: string; value: string }[] = [];


  // valores seleccionados de filtro
  startDate: Date | null = null;
  endDate: Date | null = null;

  // modal de asignación
  selectedDeposit: Deposit | null = null;
  displayModal: boolean = false;
  purchaseRate: number | null = null;

  isRateInvalid: boolean = false;


  // cuentas a consultar
  private cuentas = ['MILTON', 'CESAR', 'MARCEL', 'SONIA'];

  constructor(
    private depositService: DepositService,
    private buyService: BuyDollarsService
  ) {}

  ngOnInit(): void {
    this.loadDeposits();
  }

  /** Trae depósitos de todas las cuentas y combina */
  loadDeposits(): void {
  const requests = this.cuentas.map(account =>
    this.depositService.getDeposits(account).pipe(
      map((deposits: Deposit[]) =>  // Aquí también actualizamos el tipo
        deposits.map(d => ({
          dollars: d.dollars,             // Usamos las nuevas propiedades
          tasa: d.tasa,
          nameAccount: d.nameAccount,
          date: d.date,                   // 'date' en lugar de 'completeTime'
          idDeposit: d.idDeposit,         // 'idDeposit' en lugar de 'txId'
          pesos: d.pesos                  // 'pesos' en lugar de 'amount'
        }))
      )
    )
  );

  forkJoin(requests).subscribe({
    next: (arrays: Deposit[][]) => {
      this.allDeposits = arrays.flat();
      this.filteredDeposits = [...this.allDeposits];

      // Opciones de filtro
      this.accountFilterOptions = this.cuentas.map(c => ({ label: c, value: c }));
    },
    error: err => {
      console.error('Error cargando depósitos', err);
      alert('No se pudieron cargar los depósitos');
    }
  });
}

validateRate(): void {
  this.isRateInvalid = !this.purchaseRate || this.purchaseRate < 3500;
}



  /** Aplica filtros a la tabla */
  applyFilters(): void {
    this.filteredDeposits = this.allDeposits.filter(d => {
      const dt = new Date(d.date);
      return (!this.startDate || dt >= this.startDate)
          && (!this.endDate   || dt <= this.endDate);
    });
  }
  clearDateFilter(): void {
    this.startDate = null;
    this.endDate   = null;
    this.filteredDeposits = [...this.allDeposits];
  }

  /** Abre modal para asignar compra */
 openAssignModal(deposit: Deposit): void {
  this.selectedDeposit = deposit;
  this.purchaseRate = null;
  this.isRateInvalid = false;
  this.displayModal = true;
}


  /** Cierra modal */
  closeModal(): void {
    this.displayModal = false;
    this.selectedDeposit = null;
    this.purchaseRate = null;
  }

  saveAssignment(): void {
    if (!this.selectedDeposit || !this.purchaseRate) return;

    const pesos = this.selectedDeposit.dollars * this.purchaseRate;

    const buyData: BuyDollarsDto = {
      dollars: this.selectedDeposit.dollars,
      tasa: this.purchaseRate,
      nameAccount: this.selectedDeposit.nameAccount,
      pesos: this.selectedDeposit.dollars * this.purchaseRate,
      date: new Date(this.selectedDeposit.date),
      supplierId: 1,
      idDeposit: this.selectedDeposit.idDeposit   // <-- aquí
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
