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
    CommonModule 
  ]
})
export class SaldosComponent implements OnInit {
  accounts: any[] = [];

  // Modales y estados
  productDialog = false;
  createAccountDialog = false;
  modalVisible = false;

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
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadAccounts();
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
      next: (res: AccountBinance[]) => {
        this.accounts = res.map(cuenta => ({
          accountType: cuenta.name,
          titleUSDT: 'SALDO EN VIVO',
          valueUSDT: `$${cuenta.balance?.toFixed(2) || '0.00'}`,
          titleWallet: 'Wallet',
          valueWallet: cuenta.address || 'N/A',
          titlecorreo: 'Correo',
          valuecorreo: cuenta.correo,
          isFlipped: false
        }));
        this.updateBalances();
      },
      error: (err) => {
        console.error('❌ Error al traer cuentas:', err);
      }
    });
  }

  updateBalances() {
    this.accounts.forEach(account => {
      this.accountService.getUSDTBalanceBinance(account.accountType).subscribe({
        next: (balance) => {
          account.valueUSDT = `$${balance || '0.00'}`;
        },
        error: (err) => {
          console.error('❌ Error actualizando balance:', err);
        }
      });
    });
  }

  toggleText(account: any) {
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
}
