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

  titleUSDT = 'Saldo USDT';
  valueUSDT = '$5000';
  titlePesos = 'Saldo Pesos';
  valuePesos = '$5´000.000';

  isOriginalText = true;

  constructor( private messageService: MessageService) { }

  ngOnInit() {


      this.cols = [
          { field: 'product', header: 'Product' },
          { field: 'price', header: 'Price' },
          { field: 'category', header: 'Category' },
          { field: 'rating', header: 'Reviews' },
          { field: 'inventoryStatus', header: 'Status' }
      ];

      this.statuses = [
          { label: 'INSTOCK', value: 'instock' },
          { label: 'LOWSTOCK', value: 'lowstock' },
          { label: 'OUTOFSTOCK', value: 'outofstock' }
      ];
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
    if (this.isOriginalText) {
      // Cambiar a los nuevos textos
      this.titleUSDT = 'Wallet';
      this.valueUSDT = '123 456 ABC DEF 789';
      this.titlePesos = 'Correo';
      this.valuePesos = 'milton@polania.com';
    } else {
      // Volver a los textos originales
      this.titleUSDT = 'Saldo USDT';
      this.valueUSDT = '$5000';
      this.titlePesos = 'Saldo Pesos';
      this.valuePesos = '$5´000.000';
    }
    // Alternar el estado del indicador
    this.isOriginalText = !this.isOriginalText;
  }

  onGlobalFilter(table: Table, event: Event) {
      table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

}
