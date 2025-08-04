import { Component, OnInit } from '@angular/core';
import { SellDollarsService, SellDollar } from '../../../../core/services/sell-dollars.service';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { AccountCopService, AccountCop } from '../../../../core/services/account-cop.service';
import { SupplierService, Supplier } from '../../../../core/services/supplier.service';

@Component({
  selector: 'app-sell-tab',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    ButtonModule,
    ProgressSpinnerModule,
    FormsModule,
    InputNumberModule,
    RadioButtonModule,
    DropdownModule
  ],
  templateUrl: './sell-tab.component.html',
  styleUrls: ['./sell-tab.component.css']
})
export class SellTabComponent implements OnInit {
  sales: SellDollar[] = [];
  loading = false;
  displayDetail = false;
  selectedSale: SellDollar | null = null;
  clientesMap = new Map<number, Cliente>();

  displayEditDialog = false;
  editableSale: any = null;
  isSpecialClient = true;

clientes: any[] = []; // Se llena con los mismos datos que clientesMap
suppliers: any[] = []; // Cargar proveedores reales
accountCops: any[] = []; // Cuentas COP que puedes asignar

  constructor(
    private sellService: SellDollarsService,
    private clienteService: ClienteService,
    private supplierService: SupplierService,
    private accountCopService: AccountCopService
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadSales();
  }

  loadClients(): void {
    this.clienteService.listar().subscribe({
      next: list => this.clientesMap = new Map(list.map(c => [c.id, c])),
      error: () => console.error('Error cargando clientes')
    });
  }

  loadSales(): void {
    this.loading = true;
    this.sellService.getSellDto().subscribe({
      next: data => {
        this.sales = data;
        this.loading = false;
      },
      error: () => {
        console.error('Error al cargar ventas');
        this.loading = false;
      }
    });
  }

  getClienteName(clienteId?: number): string {
    return clienteId ? String(this.clientesMap.get(clienteId)?.nombre || '---') : '---';
  }

  onRowClick(sale: SellDollar): void {
    this.selectedSale = sale;
    this.displayDetail = true;
  }

  rowClass(sale: SellDollar): any {
    return sale.clienteId ? { 'special-client-row': true } : {};
  }

  closeDetail(): void {
    this.displayDetail = false;
    this.selectedSale = null;
  }

  editSale(sale: SellDollar): void {
  const confirmEdit = confirm('¿Estás seguro de que deseas editar esta venta? Esto revertirá los saldos previos.');
  if (!confirmEdit) return;

  this.selectedSale = sale;
  this.editableSale = JSON.parse(JSON.stringify(sale));
  this.isSpecialClient = !!sale.clienteId;
  this.displayEditDialog = true;
  console.log('Abriendo diálogo de edición...');

  this.loadSuppliers();
  this.loadAccountCops();
  this.clienteService.listar().subscribe({
    next: list => this.clientes = list,
    error: () => console.error('Error cargando clientes')
  });
}

closeEditDialog() {
  this.displayEditDialog = false;
  this.editableSale = null;
}

saveEdit() {
  if (!this.editableSale || typeof this.editableSale.id !== 'number') return;

  const payload: any = {
    id: this.editableSale.id,
    tasa: this.editableSale.tasa,
    dollars: this.editableSale.dollars,
    pesos: this.editableSale.dollars * this.editableSale.tasa,
    accounts: this.editableSale.accounts || []
  };

  if (this.isSpecialClient) {
    payload.clienteId = this.editableSale.clienteId!;
  } else {
    payload.supplier = this.editableSale.supplier!;
  }

  console.log('📦 Payload final sin campos innecesarios:', JSON.stringify(payload, null, 2));

  this.sellService.updateSellDollar(payload.id, payload).subscribe({
    next: () => {
      alert('✅ Venta actualizada exitosamente');
      this.displayEditDialog = false;
      this.loadSales();
    },
    error: (err) => {
      console.error('❌ Error actualizando venta', err);
      alert('Hubo un error actualizando la venta');
    }
  });
}
loadSuppliers(): void {
  this.supplierService.getAllSuppliers().subscribe({
    next: (data: Supplier[]) => this.suppliers = data,
    error: () => console.error('Error cargando proveedores')
  });
}

addAccountField() {
  if (!this.editableSale.accounts) {
    this.editableSale.accounts = [];
  }

  this.editableSale.accounts.push({
    accountCop: this.accountCops.length > 0 ? this.accountCops[0].id : null,
    amount: 0
  });
}

loadAccountCops(): void {
  this.accountCopService.getAll().subscribe({
    next: (data: AccountCop[]) => {
      this.accountCops = data.filter(c => c.name); // filtramos nulos
      console.log('✅ Cuentas COP cargadas:', this.accountCops);
    },
    error: () => console.error('❌ Error cargando cuentas COP')
  });
}

}