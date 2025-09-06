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

import { TableColumn } from '../../../../../shared/mi-table/mi-table.component';
import { MiTableComponent } from '../../../../../shared/mi-table/mi-table.component';
import { CardListComponent } from '../../../../../shared/mi-card/mi-card.component';

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
    RadioButtonModule,
    CardListComponent,
    MiTableComponent
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
  isMobile: boolean = false;

  startDate: Date | null = null;
  endDate: Date | null = null;
  suppliers: Supplier[] = [];
  selected: SellDollar | null = null;
  displayModal = false;
  saleRate: number | null = null;
  selectedSupplierId: number | null = null;

  //campo es el nombre de donde tomo el dato y columna como quiero que se muestre
  columns: TableColumn[] = [
    { campo: 'nameAccount', columna: 'Cuenta' },
    { campo: 'dollars', columna: 'Monto' },
    { campo: 'date', columna: 'Fecha' },
    { campo: 'getClienteById(sale.clienteId)?.nombre ?? "----"', columna: 'Cliente' }
  ];

  constructor(private sellService: SellDollarsService,
    private supplierService: SupplierService,
    private accountCopService: AccountCopService,
    private clienteService: ClienteService) { }

  ngOnInit(): void {
    this.loadSales();
    this.loadSuppliers();
    this.loading = true;

    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });

    this.accountCopService.getAll().subscribe({
      next: (accounts) => this.accountCops = accounts,
      error: () => alert('Error cargando cuentas COP')
    });

    this.clienteService.listar().subscribe({
      next: (data) => this.clientes = data,
      error: () => alert('Error cargando clientes especiales')
    });

    this.sellService.importarVentasAutomaticamente().subscribe({
      next: () => {
        this.loadSales();  // Ahora sí carga las ventas después de importar
      },
      error: err => {
        console.error('Error al importar ventas automáticas', err);
        alert('Error al registrar automáticamente las ventas');
        this.loadSales();  // Igual carga las compras en caso de error
      }
    })

  }

  loadSales(): void {
    this.loading = true;
    this.sellService.getNoAsignadas().subscribe({
      next: (data: SellDollar[]) => {
        this.allSales = data;
        this.filteredSales = [...this.allSales];
        this.loading = false;
      },
      error: (err: any) => {
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
    return (this.selected?.dollars || 0) * (this.saleRate || 0);
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


  // src/app/pages/asignaciones/tabs/asignaciones-tab/asignaciones-ventas/asignaciones-ventas.component.ts

// ... (código existente)

saveSale(): void {
    if (!this.selected || !this.saleRate ||
        (this.isSpecialClient && !this.selectedClientId) ||
        (!this.isSpecialClient && !this.selectedSupplierId)) {
        alert('Faltan datos obligatorios');
        return;
    }

    const pesos = this.selected.dollars * this.saleRate;

    // ✅ CORRECCIÓN: Creamos un objeto limpio con solo los datos a asignar.
    const assignDto: Partial<SellDollar> = {
        tasa: this.saleRate,
        pesos: pesos,
        dollars: this.selected.dollars,
        accounts: this.accounts,
    };

    // ✅ CORRECCIÓN: Asigna el cliente o el proveedor de forma segura.
    if (this.isSpecialClient) {
        // Asignamos el ID si existe, de lo contrario es undefined.
        assignDto.clienteId = this.selectedClientId ?? undefined;
    } else {
        // Asignamos el ID si existe, de lo contrario es undefined.
        assignDto.supplier = this.selectedSupplierId ?? undefined;
    }

    // ✅ Llama al servicio con el objeto corregido
    this.sellService.asignarVenta(this.selected.id!, assignDto).subscribe({
        next: () => {
            alert('Venta asignada con éxito');
            this.closeModal();
            this.loadSales();
        },
        error: (err) => {
            console.error('Error al asignar venta', err);
            alert('Error al asignar la venta: ' + (err.error?.message || err.statusText));
        }
    });
}
  

  getClienteById(id: number | undefined): Cliente | undefined {
    return this.clientes.find(c => c.id === id);
  }
  getRowClass(sale: SellDollar): string {
    return sale.clienteId ? 'special-client-row' : '';
  }

}
