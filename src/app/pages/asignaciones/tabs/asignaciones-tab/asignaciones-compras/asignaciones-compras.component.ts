import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { BuyDollarsService, BuyDollarsDto } from '../../../../../core/services/buy-dollars.service';
import { Supplier, SupplierService } from '../../../../../core/services/supplier.service';
<<<<<<< HEAD
import { Cliente, ClienteService } from '../../../../../core/services/cliente.service';
import { TableModule } from 'primeng/table';
=======
import { Table, TableModule } from 'primeng/table';
>>>>>>> 6bb55f4 (añadiendo componentes reutilizables)
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AccordionModule } from 'primeng/accordion';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
<<<<<<< HEAD
import { RadioButtonModule } from 'primeng/radiobutton';
=======

import { TableColumn } from '../../../../../shared/mi-table/mi-table.component';
import { MiTableComponent } from '../../../../../shared/mi-table/mi-table.component';
import { CardListComponent } from '../../../../../shared/mi-card/mi-card.component';

>>>>>>> 6bb55f4 (añadiendo componentes reutilizables)

@Component({
  selector: 'app-asignaciones-compras',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    ProgressSpinnerModule,
    AccordionModule,
    PanelMenuModule,
<<<<<<< HEAD
    RadioButtonModule
=======
    MiTableComponent,
    CardListComponent
>>>>>>> 6bb55f4 (añadiendo componentes reutilizables)
  ],
  templateUrl: './asignaciones-compras.component.html',
  styleUrls: ['./asignaciones-compras.component.css']
})
export class AsignacionesComprasComponent implements OnInit, AfterViewInit {

  items: MenuItem[] = [];

  @ViewChild('compraTemplate') compraTemplate!: TemplateRef<any>;
  @ViewChild('ventasTemplate') ventasTemplate!: TemplateRef<any>;
  @ViewChild('p2pTemplate') p2pTemplate!: TemplateRef<any>;

  ngAfterViewInit() {
    this.items = [
      {
        label: 'compras por asignar',
        items: []
      }
    ];
  }

  allDeposits: BuyDollarsDto[] = [];
  filteredDeposits: BuyDollarsDto[] = [];

  startDate: Date | null = null;
  endDate: Date | null = null;

  selectedDeposit: BuyDollarsDto | null = null;
  displayModal: boolean = false;
  purchaseRate: number | null = null;

  isRateInvalid: boolean = false;
  suppliers: Supplier[] = [];
  selectedSupplierId: number | null = null;
  clientes: Cliente[] = [];
  selectedClienteId: number | null = null;

  // 🔹 propiedad que faltaba
  assignmentType: 'proveedor' | 'cliente' | null = null;

  loading: boolean = false;
  isMobile: boolean = false;

<<<<<<< HEAD
  constructor(
    private buyService: BuyDollarsService,
    private supplierService: SupplierService,
    private clienteService: ClienteService
  ) {}
=======
//intento de crear tabla a partir del componente MiTabla
columns: TableColumn[] = [
  { campo: 'nameAccount', columna: 'Cuenta' },
  { campo: 'dollars', columna: 'Monto' },
  { campo: 'date', columna: 'Fecha' },
];

  constructor(private buyService: BuyDollarsService, private supplierService: SupplierService) {}
>>>>>>> 6bb55f4 (añadiendo componentes reutilizables)

  ngOnInit(): void {
    this.loading = true;
    this.loadDeposits();
    this.loadSuppliers();
    this.loadClientes();
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });

    this.buyService.importarComprasAutomaticamente().subscribe({
      next: () => {
        this.loadDeposits();
      },
      error: err => {
        console.error('Error al importar compras automáticas', err);
        alert('Error al registrar automáticamente las compras');
        this.loadDeposits();
      }
    });
  }

  loadDeposits(): void {
    this.loading = true;
    this.buyService.getComprasNoAsignadasHoy().subscribe({
      next: data => {
        this.allDeposits = data;
        this.filteredDeposits = [...this.allDeposits];
        this.loading = false;
      },
      error: err => {
        console.error('Error cargando depósitos no asignados', err);
        alert('No se pudieron cargar las compras no asignadas');
        this.loading = false;
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: data => this.suppliers = data,
      error: err => console.error('Error cargando proveedores', err)
    });
  }

  loadClientes(): void {
    this.clienteService.listar().subscribe({
      next: data => this.clientes = data,
      error: err => console.error('Error cargando clientes', err)
    });
  }

  formatDate(date: Date): string {
<<<<<<< HEAD
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 19);
  }
=======
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 19);
}
>>>>>>> 6bb55f4 (añadiendo componentes reutilizables)

  validateRate(): void {
    this.isRateInvalid = !this.purchaseRate || this.purchaseRate < 3500;
  }

  openAssignModal(deposit: BuyDollarsDto): void {
    this.selectedDeposit = deposit;
    this.purchaseRate = null;
    this.isRateInvalid = false;
    this.displayModal = true;
    this.assignmentType = null; // 🔹 reiniciar selección
    this.selectedSupplierId = null;
    this.selectedClienteId = null;
  }

  closeModal(): void {
    this.displayModal = false;
    this.selectedDeposit = null;
    this.purchaseRate = null;
  }

  saveAssignment(): void {
    if (!this.selectedDeposit || !this.purchaseRate) return;

    const pesos = this.selectedDeposit.dollars * this.purchaseRate;

    const buyData: Partial<BuyDollarsDto> = {
      tasa: this.purchaseRate,
      pesos: pesos
    };

    if (this.assignmentType === 'proveedor' && this.selectedSupplierId) {
      buyData.supplierId = this.selectedSupplierId;
    } else if (this.assignmentType === 'cliente' && this.selectedClienteId) {
      buyData.clienteId = this.selectedClienteId;
    } else {
      alert('Debe seleccionar un proveedor o cliente antes de guardar');
      return;
    }

    console.log('Asignando compra ID:', this.selectedDeposit.id, 'con data:', buyData);

    this.buyService.asignarCompra(this.selectedDeposit.id!, buyData).subscribe({
      next: () => {
        alert('Compra asignada correctamente');
        this.closeModal();
        this.loadDeposits();
      },
      error: err => {
        console.error('Error asignando compra', err);
        alert('Error al asignar la compra');
      }
    });
  }
}
