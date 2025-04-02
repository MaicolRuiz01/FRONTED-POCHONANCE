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
  { titleUSDT: 'Saldo USDT', valueUSDT: '$5000', titlePesos: 'Saldo Pesos', valuePesos: '$5,000,000', accountType: 'Binance' },
  { titleUSDT: 'Saldo USDT', valueUSDT: '$3000', titlePesos: 'Saldo Pesos', valuePesos: '$3,000,000', accountType: 'Coinbase' },
  { titleUSDT: 'Saldo USDT', valueUSDT: '$2000', titlePesos: 'Saldo Pesos', valuePesos: '$2,000,000', accountType: 'Kraken' }
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

  editProduct(product: any) {
      this.product = { ...product };
      this.productDialog = true;
  }

  deleteProduct(product: any) {
      this.deleteProductDialog = true;
      this.product = { ...product };
  }

  confirmDeleteSelected() {
      this.deleteProductsDialog = false;
      this.products = this.products.filter(val => !this.selectedProducts.includes(val));
      this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
      this.selectedProducts = [];
  }

  confirmDelete() {
      this.deleteProductDialog = false;
      this.products = this.products.filter(val => val.id !== this.product.id);
      this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
      this.product = {};
  }

  hideDialog() {
      this.productDialog = false;
      this.submitted = false;
  }

  saveProduct() {
      this.submitted = true;

      if (this.product.name?.trim()) {
          if (this.product.id) {
              // @ts-ignore
              this.product.inventoryStatus = this.product.inventoryStatus.value ? this.product.inventoryStatus.value : this.product.inventoryStatus;
              this.products[this.findIndexById(this.product.id)] = this.product;
              this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
          } else {
              this.product.id = this.createId();
              this.product.code = this.createId();
              this.product.image = 'product-placeholder.svg';
              // @ts-ignore
              this.product.inventoryStatus = this.product.inventoryStatus ? this.product.inventoryStatus.value : 'INSTOCK';
              this.products.push(this.product);
              this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
          }

          this.products = [...this.products];
          this.productDialog = false;
          this.product = {};
      }
  }

  findIndexById(id: string): number {
      let index = -1;
      for (let i = 0; i < this.products.length; i++) {
          if (this.products[i].id === id) {
              index = i;
              break;
          }
      }

      return index;
  }

  createId(): string {
      let id = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 5; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
  }


  toggleText(): void {

  }
}
