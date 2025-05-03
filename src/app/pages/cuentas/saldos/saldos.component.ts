import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { AccountBinance } from '../../../../app/core/services/account-binance.service';
import { AccountBinanceService } from '../../../core/services/account-binance.service';

@Component({
  selector: 'app-saldos',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './saldos.component.html',
  styleUrl: './saldos.component.css',
  providers:
  [MessageService]
})
export class SaldosComponent {

// Array para almacenar múltiples cuentas
accounts: any[] = [
  { titleUSDT: 'Saldo USDT', valueUSDT: '$5000', titlePesos: 'Saldo Pesos', valuePesos: '$5,000,000', accountType: 'Binance', titleWallet: 'Wallet', valueWallet: 1234456697, titlecorreo: 'Correo', valuecorreo: 'miltonscito@popop'},
  { titleUSDT: 'Saldo USDT', valueUSDT: '$3000', titlePesos: 'Saldo Pesos', valuePesos: '$3,000,000', accountType: 'Coinbase', titleWallet: 'Wallet', valueWallet: 1234456697, titlecorreo: 'Correo', valuecorreo: 'darckitisio@popop'},
  { titleUSDT: 'Saldo USDT', valueUSDT: '$2000', titlePesos: 'Saldo Pesos', valuePesos: '$2,000,000', accountType: 'Kraken', titleWallet: 'Wallet', valueWallet: 1234456697, titlecorreo: 'Correo', valuecorreo: 'oveja@sololiso' }
];

// Resto de propiedades del componente
    productDialog: boolean = false;
    deleteProductDialog: boolean = false;
    deleteProductsDialog: boolean = false;
    products: any[] = [];
    product: any = {};
    selectedProducts: any[] = [];
    submitted: boolean = false;
    cols: any[] = [];
    statuses: any[] = [];
    rowsPerPageOptions = [5, 10, 20];

    isOriginalText = true;  // Posiblemente no necesitas esta propiedad si no cambias textos dinámicamente fuera del contexto de las cuentas
    modalVisible = false;
    tableData = [
      { fecha: 'Enero', us: 100, tasa: 20, pesos: 2000 },
      { fecha: 'Febrero', us: 150, tasa: 18, pesos: 2700 },
      { fecha: 'Marzo', us: 200, tasa: 22, pesos: 4400 },
      { fecha: 'Abril', us: 120, tasa: 19, pesos: 2280 }
    ];

    //crear nueva cuenta
    createAccountDialog = false;
    newAccount: AccountBinance = {
      name: '',
      referenceAccount: '',
      correo: '',
      userBinance: ''
    };

  constructor( private accountService: AccountBinanceService, private messageService: MessageService) { }

  ngOnInit() {
    this.accountService.traerCuentas().subscribe({
      next: (res: AccountBinance[]) => {
        console.log('📥 Cuentas cargadas desde backend:', res);
        this.accounts = res.map(cuenta => ({
          accountType: cuenta.name,           // Usado en el header y tipo de cuenta
          titleUSDT: cuenta.name,             // Reemplaza visualmente “Saldo USDT”
          valueUSDT: '$0',                    // Podrías ajustar si hay saldos reales
          titlePesos: 'Saldo Pesos',
          valuePesos: '$0',
          titleWallet: 'Número de cuenta',    // Etiqueta
          valueWallet: cuenta.referenceAccount, // Muestra el número real
          titlecorreo: 'Correo',
          valuecorreo: cuenta.correo     // Temporal o si deseas agregar campo real después
        }));
      },
      error: (err) => {
        console.error('❌ Error al traer cuentas:', err);
      }
    });
  }


  openNew() {
      this.product = {};
      this.submitted = false;
      this.productDialog = true;
  }

  createId(): string {
      let id = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 5; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
  }

  toggleText(account: any) {
    account.isFlipped = !account.isFlipped;
  }
  showModal() {
    this.modalVisible = true;
  }

  showDetails() {
    console.log('Detalles del item:');
    // Aquí puedes abrir otro modal o mostrar detalles adicionales
  }



  removeAccount(index: number) {
    this.accounts.splice(index, 1);
  }

  guardarCuentas() {
    this.messageService.add({severity:'success', summary:'Guardado', detail:'Cuentas actualizadas'});
    this.productDialog = false;
  }
  //modal crear cuenta

  addAccount() {
    this.newAccount = { name: '', referenceAccount: '' ,  correo: '', userBinance: ''};
    this.createAccountDialog = true;
  }

  cancelarNuevaCuenta() {
    this.createAccountDialog = false;
  }

  crearCuentaBinance() {

    if (!this.newAccount.name || !this.newAccount.referenceAccount) {
      this.messageService.add({severity:'warn', summary:'Faltan datos', detail:'Completa todos los campos'});
      return;
    }

    console.log('📤 Enviando nueva cuenta al backend:', this.newAccount);

    this.accountService.crear(this.newAccount).subscribe({
      next: (res) => {
        this.accounts.push({ accountType: res.name }); // o ajusta según tu estructura
        this.messageService.add({severity:'success', summary:'Cuenta creada', detail:'Se agregó la cuenta exitosamente'});
        this.createAccountDialog = false;
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo crear la cuenta'});
      }
    });
  }
}
