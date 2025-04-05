import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

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

  constructor( private messageService: MessageService) { }

  ngOnInit() {

  }

  openNew() {
      this.product = {};
      this.submitted = false;
      this.productDialog = true;
  }

  deleteSelectedProducts() {
      this.deleteProductsDialog = true;
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

  // nueva cuenta
  addAccount() {
    const newAccountName = prompt('Nombre de la nueva cuenta:');
    if (newAccountName) {
      this.accounts.push({
        accountType: newAccountName,
        titleUSDT: 'Saldo USDT',
        valueUSDT: '$0',
        titlePesos: 'Saldo Pesos',
        valuePesos: '$0',
        titleWallet: 'Wallet',
        valueWallet: '',
        titlecorreo: 'Correo',
        valuecorreo: ''
      });
    }
  }

  removeAccount(index: number) {
    this.accounts.splice(index, 1);
  }

  guardarCuentas() {
    this.messageService.add({severity:'success', summary:'Guardado', detail:'Cuentas actualizadas'});
    this.productDialog = false;
  }

}
