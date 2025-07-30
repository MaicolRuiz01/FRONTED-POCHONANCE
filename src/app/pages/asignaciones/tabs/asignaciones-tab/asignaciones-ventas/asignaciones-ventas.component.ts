import { Component, OnInit } from '@angular/core';
import { SellDollarsService, SellDollar } from '../../../../../core/services/sell-dollars.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SupplierService, Supplier } from '../../../../../core/services/supplier.service';
import { DropdownModule } from 'primeng/dropdown';
import { AssignAccount } from '../../../../../core/services/sell-dollars.service';
import { AccountCop, AccountCopService } from '../../../../../core/services/account-cop.service'; // Assuming this is the correct import path
import { InputNumberModule } from 'primeng/inputnumber';
import { ClienteService, Cliente } from '../../../../../core/services/cliente.service';
import { RadioButtonModule } from 'primeng/radiobutton';

@Component({
  selector: 'app-asignaciones-ventas',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    FormsModule,
    ProgressSpinnerModule,
    DropdownModule,
    InputTextModule,     // <— para <input pInputText>
  InputNumberModule,
  RadioButtonModule
  ],
  templateUrl: './asignaciones-ventas.component.html',
  styleUrls: ['./asignaciones-ventas.component.css']
})
export class AsignacionesVentasComponent implements OnInit {
  allSales: SellDollar[] = [];
  filteredSales: SellDollar[] = [];
  accounts: AssignAccount[] = [];
  accountCops: AccountCop[] = [];

  isSpecialClient: boolean | null = null;
  clientes: Cliente[] = [];
  selectedClientId: number | null = null;




  loading: boolean = false;


  startDate: Date | null = null;
  endDate: Date | null = null;
  suppliers: Supplier[] = [];
  selected: SellDollar | null = null;
  displayModal = false;
  saleRate: number | null = null;
  selectedSupplierId: number | null = null;

  constructor(private sellService: SellDollarsService, 
    private supplierService: SupplierService, 
    private accountCopService: AccountCopService,
    private clienteService: ClienteService  ) {}

  ngOnInit(): void {
    this.loadSales();
    this.loadSuppliers();
    this.accountCopService.getAll().subscribe({
  next: (accounts) => this.accountCops = accounts,
  error: () => alert('Error cargando cuentas COP')
});

  this.clienteService.listar().subscribe({
  next: (data) => this.clientes = data,
  error: () => alert('Error cargando clientes especiales')
  });
  }

  loadSales(): void {
    this.loading = true;
    this.sellService.getAllUnregisteredSales().subscribe({
      next: (sales) => {
        this.allSales = sales;
        this.filteredSales = [...this.allSales];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando ventas', err);
        alert('No se pudieron cargar las ventas');
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
      },
      error: (err) => {
        console.error('Error cargando proveedores', err);
        alert('No se pudieron cargar los proveedores');
      }
    });
  }

  get totalPesos(): number {
    return (this.selected?.dollars || 0) * (this.saleRate || 0);
  }

  get montoProveedor(): number {
    const asignado = this.accounts.reduce((sum, a) => sum + (a.amount || 0), 0);
    return this.totalPesos - asignado;
  }

  openAssignModal(sale: SellDollar): void {
  this.selected = sale;
  this.saleRate = null;
  this.selectedSupplierId = null;
  this.accounts = [];

  if (sale.clienteId) {
    this.isSpecialClient = true;
    this.selectedClientId = sale.clienteId;
  } else {
    this.isSpecialClient = false;
    this.selectedClientId = null;
  }

  this.displayModal = true;
}



  closeModal(): void {
    this.displayModal = false;
    this.selected = null;
    this.saleRate = null;
  }
  addAccountField(): void {
  this.accounts.push({ amount: 0, nameAccount: '', accountCop: null! });
}

removeAccountField(index: number): void {
  this.accounts.splice(index, 1);
}


  saveSale(): void {
    if (!this.selected || !this.saleRate || 
    (this.isSpecialClient && !this.selectedClientId) ||
    (!this.isSpecialClient && !this.selectedSupplierId)) {
  alert('Faltan datos obligatorios');
  return;
}

    const pesos = this.selected.dollars * this.saleRate;

const sell: SellDollar = {
  ...this.selected,
  tasa: this.saleRate,
  pesos,
  accounts: this.accounts,
};

// Agrega solo el campo necesario según el tipo de cliente
if (this.isSpecialClient) {
  sell.clienteId = this.selectedClientId!;
} else {
  sell.supplier = this.selectedSupplierId!;
}



    this.sellService.createSellDollar(sell).subscribe({
      next: () => {
        this.closeModal();
        this.loadSales();
      },
      error: err => alert('Error guardando la venta')
    });
  }

  getClienteById(id: number | undefined): Cliente | undefined {
  return this.clientes.find(c => c.id === id);
}
getRowClass(sale: SellDollar): string {
  return sale.clienteId ? 'special-client-row' : '';
}

}