import { Component, OnInit } from '@angular/core';
import { AccountBinanceService, AccountBinance } from '../../../../core/services/account-binance.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { AccountCopService } from '../../../../core/services/account-cop.service';
import { BalanceService } from '../../../../core/services/balance.service';
import { ConfirmDialogModule } from "primeng/confirmdialog";

export interface DisplayAccount {
  id?: number; // opcional para evitar error al inicializar
  accountType: string;
  saldoInterno: number;
  saldoExterno?: number;
  correo?: string;
  address?: string;
  isFlipped: boolean;
}

@Component({
  selector: 'app-saldos',
  templateUrl: './saldos.component.html',
  standalone: true,
  styleUrls: ['./saldos.component.css'],
  providers: [MessageService, ConfirmationService],
  imports: [
    ToastModule,
    ToolbarModule,
    DialogModule,
    TableModule,
    FormsModule,
    CommonModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    ConfirmDialogModule
  ]
})
export class SaldosComponent implements OnInit {
  totalBalanceUsd = 0;
  totalBalanceCop = 0;
  latestRate = 0;
  balanceTotalExterno = 0;

  createAccountDialog = false;
  modalVisible = false;
  cajas: { id: number, name: string, saldo: number }[] = [];

  tiposCuenta = [
    { label: 'BINANCE', value: 'BINANCE' },
    { label: 'TRUST', value: 'TRUST' }
  ];

  accounts: DisplayAccount[] = [];

  newAccount: AccountBinance = {
    name: '',
    referenceAccount: '',
    correo: '',
    userBinance: '',
    balance: 0,
    address: '',
    tipo: '',
    apiKey: '',
    apiSecret: ''
  };

  totalCajasCop: number = 0;

  constructor(
    private accountService: AccountBinanceService,
    private cajaService: AccountCopService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private http: HttpClient,
    private balanceService: BalanceService
  ) { }

  ngOnInit() {
    this.loadAccounts();
    this.getTotalBalance();
    this.getLatestPurchaseRate();
    this.getBalanceTotalInterno();
    this.getBalanceTotalExterno();
    this.loadCajas();
    this.getTotalCajas();
  }

  getTotalBalance() {
    this.accountService.getTotalBalance().subscribe({
      next: res => this.totalBalanceCop = res,
      error: err => console.error('Error obteniendo saldo total:', err)
    });
  }

  getBalanceTotalExterno() {
    this.accountService.getBalanceTotalExterno().subscribe({
      next: res => this.balanceTotalExterno = res,
      error: err => console.error('Error obteniendo saldo total externo:', err)
    });
  }

  getBalanceTotalInterno() {
    this.accountService.getBalanceTotalInterno().subscribe({
      next: res => this.totalBalanceUsd = res,
      error: err => console.error('Error obteniendo saldo total interno:', err)
    });
  }

  loadCajas() {
    this.cajaService.getAllCajas().subscribe({
      next: res => {
        this.cajas = res;
      },
      error: err => console.error('Error cargando cajas:', err)
    });
  }

  loadAccounts() {
    this.accountService.traerCuentas().subscribe({
      next: res => {
        this.accounts = res.map(c => ({
          id: c.id, // aquí guardamos el id real que viene del backend
          accountType: c.name,
          saldoInterno: c.balance,
          correo: c.correo || '–',
          address: c.address || '–',
          isFlipped: false,
          saldoExterno: 0
        }));

        this.accounts.forEach(acc => {
          this.accountService.getUSDTBalanceBinance(acc.accountType)
            .subscribe({
              next: live => {
                acc.saldoExterno = parseFloat(live) || 0;
                this.sortByExternal();
              },
              error: _ => {
                acc.saldoExterno = 0;
                this.sortByExternal();
              }
            });
        });
      },
      error: err => console.error(err)
    });
  }

  private sortByExternal() {
    this.accounts.sort((a, b) => (b.saldoExterno || 0) - (a.saldoExterno || 0));
  }

  toggleText(account: DisplayAccount) {
    account.isFlipped = !account.isFlipped;
  }

  openNew() {
    this.newAccount = {
      name: '',
      referenceAccount: '',
      correo: '',
      userBinance: '',
      balance: 0,
      address: '',
      tipo: '',
      apiKey: '',
      apiSecret: ''
    };
    this.createAccountDialog = true;
  }

  cancelarNuevaCuenta() {
    this.createAccountDialog = false;
  }

  crearCuentaBinance() {
    if (!this.newAccount.name || !this.newAccount.referenceAccount || !this.newAccount.tipo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Completa todos los campos'
      });
      return;
    }

    if (this.newAccount.tipo === 'TRUST') {
      this.newAccount.apiKey = null!;
      this.newAccount.apiSecret = null!;
    }

    this.accountService.crear(this.newAccount).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cuenta creada',
          detail: 'Se agregó la cuenta exitosamente'
        });
        this.createAccountDialog = false;
        this.loadAccounts();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la cuenta'
        });
      }
    });
  }

  getLatestPurchaseRate() {
    this.accountService.getLatestPurchaseRate().subscribe({
      next: res => this.latestRate = res,
      error: err => console.error('Error obteniendo tasa de compra:', err)
    });
  }

  getTotalCajas() {
    this.balanceService.getTotalCajas().subscribe({
      next: res => this.totalCajasCop = res.total,
      error: err => console.error('Error obteniendo total de cajas:', err)
    });
  }

  // NUEVO: Confirmación y eliminación
  confirmDelete(account: DisplayAccount) {
    this.confirmationService.confirm({
      message: `¿Seguro que quieres eliminar la cuenta ${account.accountType}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (account.id) {
          this.deleteAccount(account.id);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se encontró el ID de la cuenta'
          });
        }
      }
    });
  }

  deleteAccount(id: number) {
    this.accountService.deleteAccount(id).subscribe({
      next: () => {
        this.accounts = this.accounts.filter(a => a.id !== id);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminada',
          detail: 'Cuenta eliminada correctamente'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la cuenta'
        });
      }
    });
  }
  
  editarCuenta(account: DisplayAccount) {
    // Pasar los datos de la cuenta seleccionada al formulario para editarlos
    this.newAccount = {
      name: account.accountType,
      referenceAccount: '', // Aquí pones el valor real si lo tienes
      correo: account.correo || '',
      userBinance: '', // idem, si tienes el valor
      balance: account.saldoInterno,
      address: account.address || '',
      tipo: '', // asigna según corresponda
      apiKey: '',
      apiSecret: ''
    };

    this.createAccountDialog = true; // abre el modal para editar
  }

}
