import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { TableColumn, MiTableComponent } from '../../../../../shared/mi-table/mi-table.component';
import { CardListComponent } from '../../../../../shared/mi-card/mi-card.component';

import { BuyP2PService, BuyP2PDto } from '../../../../../core/services/buy-p2p.service';
import { AccountCopService, AccountCop } from '../../../../../core/services/account-cop.service';
import { AccountBinanceService, AccountBinance } from '../../../../../core/services/account-binance.service';

@Component({
  selector: 'app-asignaciones-comprap2p',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    MultiSelectModule,
    RadioButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    MiTableComponent,
    CardListComponent
  ],
  templateUrl: './asignaciones-comprap2p.component.html',
  styleUrls: ['./asignaciones-comprap2p.component.css']
})
export class AsignacionesComprap2pComponent implements OnInit {

  allBuysP2P: BuyP2PDto[] = [];

  binanceAccounts: AccountBinance[] = [];
  selectedBinanceAccount: AccountBinance | null = null;

  cuentasDisponibles: AccountCop[] = [];
  selectedAccounts: AccountCop[] = [];

  selectedBuy: BuyP2PDto | null = null;

  // asignación
  isExternal: boolean = false;
  selectedAssignments: { account: AccountCop; amount: number }[] = [];
  displayAssignDialog: boolean = false;
  externalAccountName: string = '';
  externalAmount: number = 0;

  noBuysMessage: string = '';
  loading: boolean = false;
  isMobile: boolean = false;

  columns: TableColumn[] = [
    { campo: 'numberOrder', columna: 'N° de orden' },
    { campo: 'date', columna: 'Fecha' },
    { campo: 'dollarsUs', columna: 'Dolares' },
    { campo: 'pesosCop', columna: 'Pesos COP' },
    { campo: 'commission', columna: 'Comision' }
  ];

  constructor(
    private buyService: BuyP2PService,
    private accountBinanceService: AccountBinanceService,
    private accountCopService: AccountCopService
  ) {}

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });

    this.loadBinanceAccounts();
    this.loadCuentasCop();
    this.loadNoAsignadas();
  }

  // ✅ si tu AccountBinanceService ya tiene un método diferente, ajusta el nombre aquí
  loadBinanceAccounts(): void {
  this.accountBinanceService.traerCuentas().subscribe({
    next: (data: AccountBinance[]) => {
      this.binanceAccounts = data ?? [];
    },
    error: (err: any) => console.error('Error cargando cuentas Binance:', err)
  });
}


  // ✅ si tu AccountCopService ya tiene un método diferente, ajusta el nombre aquí
  loadCuentasCop(): void {
  this.accountCopService.getAll().subscribe({
    next: (data: AccountCop[]) => {
      this.cuentasDisponibles = data ?? [];
    },
    error: (err: any) => console.error('Error cargando cuentas COP:', err)
  });
}


  loadNoAsignadas(): void {
    this.loading = true;
    this.noBuysMessage = '';

    const req$ = this.selectedBinanceAccount
      ? this.buyService.getTodayNoAsignadas(this.selectedBinanceAccount.name)
      : this.buyService.getTodayNoAsignadasAllAccounts();

    req$.subscribe({
      next: (buys: BuyP2PDto[]) => {
        this.allBuysP2P = buys ?? [];
        if (this.allBuysP2P.length === 0) {
          this.noBuysMessage = 'No hay compras P2P no asignadas hoy.';
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar compras P2P no asignadas:', err);
        this.noBuysMessage = 'Error al obtener compras';
        this.loading = false;
      }
    });
  }

  onFilterByAccount(): void {
    this.loadNoAsignadas();
  }

  openAssignDialog(buy: BuyP2PDto): void {
    this.selectedBuy = buy;
    this.displayAssignDialog = true;

    this.externalAccountName = '';
    this.externalAmount = 0;

    this.selectedAccounts = [];
    this.selectedAssignments = [];

    this.isExternal = false;
  }

  handleAssignType(): void {
    if (this.isExternal) {
      this.externalAccountName = '';
      this.externalAmount = 0;
      this.selectedAccounts = [];
      this.selectedAssignments = [];
    } else {
      this.externalAccountName = '';
      this.externalAmount = 0;
    }
  }

  onAccountsChange(): void {
    this.selectedAssignments = this.selectedAccounts.map((account: AccountCop) => {
      const existing = this.selectedAssignments.find(a => a.account.id === account.id);
      return {
        account,
        amount: existing?.amount || 0
      };
    });
  }

  assignAccounts(): void {
    if (!this.selectedBuy) {
      alert('Por favor selecciona una compra.');
      return;
    }

    if (this.isExternal) {
      if (!this.externalAmount || this.externalAmount <= 0) {
        alert('Ingresa un monto válido.');
        return;
      }

      const accounts = [{
        amount: this.externalAmount,
        nameAccount: this.externalAccountName || '',
        accountCop: null
      }];

      this.submitAssignRequest(accounts);
      return;
    }

    // colombianas
    const total = this.selectedAssignments.reduce((sum, a) => sum + (a.amount || 0), 0);
    if (total > (this.selectedBuy.pesosCop || 0)) {
      alert('El total asignado excede el monto de la compra.');
      return;
    }

    const accounts: { amount: number; nameAccount: string; accountCop: number | null }[] =
  this.selectedAssignments.map(a => ({
    amount: a.amount,
    nameAccount: a.account.name,
    accountCop: a.account.id ?? null
  }));


    this.submitAssignRequest(accounts);
  }

  submitAssignRequest(accounts: { amount: number; nameAccount: string; accountCop: number | null }[]): void {
    if (!this.selectedBuy) return;

    this.buyService.assignAccounts(this.selectedBuy.id, accounts).subscribe({
      next: () => {
        alert('Cuentas asignadas exitosamente.');
        this.displayAssignDialog = false;
        this.loadNoAsignadas();
      },
      error: (err: any) => {
        console.error('Error al asignar cuentas:', err);
        alert('Error al asignar las cuentas');
      }
    });
  }
}
