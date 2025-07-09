import { Component, OnInit } from '@angular/core';
import { AccountBinanceService } from '../../../../core/services/account-binance.service';
import { MessageService } from 'primeng/api';
import { AccountBinance } from '../../../../../app/core/services/account-binance.service';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface DisplayAccount {
  accountType: string;
  saldoInterno: number;
  saldoExterno?: number;
  correo?: string;
  address?: string;
  isFlipped: boolean;
   titleUSDT?: string;
  valueUSDT?: string;
  titleWallet?: string;
  valueWallet?: string;
  titlecorreo?: string;
  valuecorreo?: string;
}

@Component({
  selector: 'app-saldos',
  templateUrl: './saldos.component.html',
  standalone: true,
  styleUrls: ['./saldos.component.css'],
  providers: [MessageService],
  imports: [ToastModule,
    ToolbarModule,
    DialogModule,
    TableModule,
    FormsModule,
    CommonModule,
    
  ]
})
export class SaldosComponent implements OnInit {
  // Nuevo: saldo total traído desde el backend
  totalBalanceUsd: number = 0;
  totalBalanceCop: number = 0;
  latestRate: number = 0;


  // Modales y estados
  productDialog = false;
  createAccountDialog = false;
  modalVisible = false;
  accounts: DisplayAccount[] = [];


  // Nuevos datos de cuenta
  newAccount: AccountBinance = {
    name: '',
    referenceAccount: '',
    correo: '',
    userBinance: '',
    balance: 0,
    address: ''
  };

  constructor(
    private accountService: AccountBinanceService,
    private messageService: MessageService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.loadAccounts();
    this.getTotalBalance();
    this.getLatestPurchaseRate();
  }

  getTotalBalance() {
  this.accountService.getTotalBalance().subscribe({
    next: (res) => {
      this.totalBalanceCop = res;
    },
    error: (err) => console.error('Error obteniendo saldo total:', err)
  });
}


  // Datos de tabla
  tableData = [
    { fecha: 'Enero', us: 100, tasa: 20, pesos: 2000 },
    { fecha: 'Febrero', us: 150, tasa: 18, pesos: 2700 },
    { fecha: 'Marzo', us: 200, tasa: 22, pesos: 4400 },
    { fecha: 'Abril', us: 120, tasa: 19, pesos: 2280 }
  ];

  showDetails() {
    console.log('Detalles del item:');
  }

   loadAccounts() {
    this.accountService.traerCuentas().subscribe({
      next: (res) => {
        // 1) Inicialmente mapeamos solo el interno y demás datos estáticos
        this.accounts = res.map(c => ({
          accountType: c.name,
          saldoInterno: c.balance,
          correo: c.correo || '–',
          address: c.address || '–',
          isFlipped: false,
          saldoExterno: 0   // para tener definida la propiedad
        }));

        // 2) Ahora pedimos y asignamos el saldo externo, ordenando tras cada actualización
        this.accounts.forEach(acc => {
          this.accountService.getUSDTBalanceBinance(acc.accountType)
            .subscribe({
              next: live => {
                acc.saldoExterno = parseFloat(live) || 0;
                this.sortByExternal();   // reordena tras asignar cada uno
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

  /** Ordena el array de cuentas de mayor a menor según 'saldoExterno' */
  private sortByExternal() {
    this.accounts.sort((a, b) => (b.saldoExterno || 0) - (a.saldoExterno || 0));
  }

  toggleText(account: DisplayAccount) {
    account.isFlipped = !account.isFlipped;
  }




  showModal() {
    this.modalVisible = true;
  }

  openNew() {
    this.productDialog = true;
  }

  addAccount() {
    this.newAccount = {
      name: '',
      referenceAccount: '',
      correo: '',
      userBinance: '',
      balance: 0,
      address: ''
    };
    this.createAccountDialog = true;
  }

  cancelarNuevaCuenta() {
    this.createAccountDialog = false;
  }

  crearCuentaBinance() {
    if (!this.newAccount.name || !this.newAccount.referenceAccount) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Completa todos los campos'
      });
      return;
    }

    this.accountService.crear(this.newAccount).subscribe({
      next: (res) => {
        this.accounts.push({
          accountType: res.name,
          titleUSDT: 'Saldo USDT',
          saldoInterno: res.balance,          // ← Aquí
          saldoExterno: undefined, 
          valueUSDT: `$${res.balance?.toFixed(2) || '0.00'}`,
          titleWallet: 'Wallet',
          valueWallet: res.address || 'N/A',
          titlecorreo: 'Correo',
          valuecorreo: res.correo,
          isFlipped: false
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Cuenta creada',
          detail: 'Se agregó la cuenta exitosamente'
        });
        this.createAccountDialog = false;
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

  removeAccount(index: number) {
    this.accounts.splice(index, 1);
  }

  guardarCuentas() {
    this.messageService.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Cuentas actualizadas'
    });
    this.productDialog = false;
  }

  getLatestPurchaseRate() {
  this.accountService.getLatestPurchaseRate().subscribe({
    next: (res) => {
      this.latestRate = res;
    },
    error: (err) => console.error('Error obteniendo tasa de compra:', err)
  });
}

}
