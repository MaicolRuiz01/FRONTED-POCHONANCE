import { Component } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { AccountBinance } from '../../../../../app/core/services/account-binance.service';
import { AccountBinanceService } from '../../../../core/services/account-binance.service';
@Component({
  selector: 'app-saldos',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './saldos.component.html',
  styleUrl: './saldos.component.css',
  providers: [MessageService]
})
export class SaldosComponent {

  accounts: any[] = [];

  // Modales y estados
  productDialog = false;
  deleteProductDialog = false;
  deleteProductsDialog = false;
  createAccountDialog = false;
  modalVisible = false;

  // Datos de tabla
  tableData = [
    { fecha: 'Enero', us: 100, tasa: 20, pesos: 2000 },
    { fecha: 'Febrero', us: 150, tasa: 18, pesos: 2700 },
    { fecha: 'Marzo', us: 200, tasa: 22, pesos: 4400 },
    { fecha: 'Abril', us: 120, tasa: 19, pesos: 2280 }
  ];

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
    this.accountService.traerCuentas().subscribe({
      next: (res: AccountBinance[]) => {
        console.log('📥 Cuentas cargadas desde backend:', res);
        this.accounts = res.map(cuenta => ({
          accountType: cuenta.name,
          titleUSDT: 'Saldo USDT',
          valueUSDT: `$${cuenta.balance?.toFixed(2) || '0.00'}`,
          titlePesos: 'Saldo Pesos',
          valuePesos: `$${(cuenta.balance * 4000).toLocaleString()}`, // conversión estimada
          titleWallet: 'Wallet',
          valueWallet: cuenta.address || 'N/A',
          titlecorreo: 'Correo',
          valuecorreo: cuenta.correo,
          isFlipped: false
        }));
      },
      error: (err) => {
        console.error('❌ Error al traer cuentas:', err);
      }
    });
  }

  toggleText(account: any) {
    account.isFlipped = !account.isFlipped;
  }

  showModal() {
    this.modalVisible = true;
  }

  showDetails() {
    console.log('Detalles del item:');
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

    console.log('📤 Enviando nueva cuenta al backend:', this.newAccount);

    this.accountService.crear(this.newAccount).subscribe({
      next: (res) => {
        this.accounts.push({
          accountType: res.name,
          titleUSDT: 'Saldo USDT',
          valueUSDT: `$${res.balance?.toFixed(2) || '0.00'}`,
          titlePesos: 'Saldo Pesos',
          valuePesos: `$${(res.balance * 4000).toLocaleString()}`,
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
