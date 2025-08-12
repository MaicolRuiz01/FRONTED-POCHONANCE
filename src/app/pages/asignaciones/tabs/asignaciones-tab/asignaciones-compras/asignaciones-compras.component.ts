import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { BuyDollarsService, BuyDollarsDto } from '../../../../../core/services/buy-dollars.service';
import { Supplier, SupplierService } from '../../../../../core/services/supplier.service';
import { TableModule } from 'primeng/table';
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
    PanelMenuModule

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
        items: [
        ]
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
  loading: boolean = false;
  isMobile: boolean = false;

  constructor(private buyService: BuyDollarsService, private supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadDeposits();
    this.loadSuppliers();
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
    this.buyService.importarComprasAutomaticamente().subscribe({
    next: () => {
      this.loadDeposits();  // Ahora sí carga las compras después de importar
    },
    error: err => {
      console.error('Error al importar compras automáticas', err);
      alert('Error al registrar automáticamente las compras');
      this.loadDeposits();  // Igual carga las compras en caso de error
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

  formatDate(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 19);
}




  validateRate(): void {
    this.isRateInvalid = !this.purchaseRate || this.purchaseRate < 3500;
  }


  openAssignModal(deposit: BuyDollarsDto): void {
    this.selectedDeposit = deposit;
    this.purchaseRate = null;
    this.isRateInvalid = false;
    this.displayModal = true;
    this.selectedSupplierId = null;
  }

  closeModal(): void {
    this.displayModal = false;
    this.selectedDeposit = null;
    this.purchaseRate = null;
  }

  saveAssignment(): void {
  if (!this.selectedDeposit || !this.purchaseRate || !this.selectedSupplierId) return;

  const pesos = this.selectedDeposit.dollars * this.purchaseRate;

  const buyData: Partial<BuyDollarsDto> = {
    tasa: this.purchaseRate,
    pesos: pesos,
    supplierId: this.selectedSupplierId
  };

  console.log('Asignando compra ID:', this.selectedDeposit.id, 'con data:', buyData);

  this.buyService.asignarCompra(this.selectedDeposit.id!, buyData).subscribe({
    next: () => {
      alert('Compra asignada correctamente');
      this.closeModal();
      this.loadDeposits(); // Recarga la lista con solo las no asignadas
    },
    error: err => {
      console.error('Error asignando compra', err);
      alert('Error al asignar la compra');
    }
  });
}

}
