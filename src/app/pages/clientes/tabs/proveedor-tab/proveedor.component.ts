import { Component, OnInit } from '@angular/core';
import { SupplierService, Supplier } from '../../../../core/services/supplier.service';
import { PagoProveedorService } from '../../../../core/services/pago-proveedor.service';
import { AccountCopService, AccountCop } from '../../../../core/services/account-cop.service';
import { FormsModule  } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';  
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ListaPagosComponent } from './lista-pagos/lista-pagos.component';
import { CardModule } from 'primeng/card'; // Importa el componente ListaPagos
import { CommonModule } from '@angular/common'; 
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    FormsModule,
    DialogModule,
    ListaPagosComponent,
    CardModule,
    CommonModule,
    CalendarModule
  ],
  templateUrl: './proveedor.component.html',
  styleUrls: ['./proveedor.component.css']
})
export class ProveedorComponent implements OnInit {
  suppliers: Supplier[] = [];
  accountCops: AccountCop[] = [];
  selectedAccountCop: AccountCop | null = null;
  selectedSupplier: Supplier | null = null;
  amount: number = 0;
  showPaymentForm: boolean = false;
  pagos: any[] = []; // Variable para almacenar los pagos del proveedor
  showPagosDialog: boolean = false; // nuevo
  showform: boolean = false; // nuevo


  Supplier_name: string = '';
  Supplier_balance: number = 0; // nuevo, balance por defecto
  SupplierlastPaymentDate: Date = new Date(); // nuevo, fecha por defecto

  constructor(
    private supplierService: SupplierService,
    private accountCopService: AccountCopService,
    private paymentService: PagoProveedorService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.accountCopService.getAll().subscribe(accountCops => this.accountCops = accountCops);
  }

  

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (data) => this.suppliers = data,
      error: (err) => console.error('Error loading suppliers', err)
    });
  }

  get totalProveedores(): number {
    return this.suppliers.reduce((acc, supplier) => acc + (supplier.balance ?? 0), 0);
  }

  showAllSuppliers(): void {
    this.loadSuppliers();
  }

  showFormsupplier(): void {
    this.showform = !this.showform; // Cambia el estado del formulario  
  }

  createSupplier(data: any): void {
  this.supplierService.createSupplier({
    name: data.name,
    balance: data.balance || 0, // Asigna un balance por defecto si no se proporciona
    lastPaymentDate: new Date()
  }).subscribe({
    next: (supplier) => {
      this.suppliers.push(supplier);
      this.showform = false;

      this.Supplier_name = '';
      this.Supplier_balance = 0;
      this.SupplierlastPaymentDate = new Date();
    },
    error: (err) => console.error('Error creating supplier', err)
  }); 
}


  // Obtener los pagos asociados al proveedor seleccionado
  loadPagosBySupplier(): void {
    if (this.selectedSupplier) {
      const supplierId = this.selectedSupplier.id;
      this.paymentService.getPagosBySupplier(supplierId).subscribe({
        next: (data) => this.pagos = data,
        error: (err) => console.error('Error loading payments', err)
      });
    }
  }

  // Llamar al servicio para realizar el pago
  makePayment(): void {
    const accountCopId = Number(this.selectedAccountCop?.id ?? 0);
    const supplierId = Number(this.selectedSupplier?.id ?? 0);

    if (accountCopId === 0 || supplierId === 0) {
      console.error('Cuenta o proveedor no seleccionados');
      return;
    }

    this.paymentService.makePayment(accountCopId, supplierId, this.amount)
      .subscribe(
        response => {
          console.log('Pago realizado exitosamente', response);
        },
        error => {
          console.error('Error realizando el pago:', error);
        }
      );
  }

  // Toggle para mostrar/ocultar el formulario de pago
  togglePaymentForm(): void {
    this.showPaymentForm = !this.showPaymentForm;
  }

  onSelectSupplier(supplier: Supplier): void {
  this.selectedSupplier = supplier;
  this.loadPagosBySupplier();
  this.showPagosDialog = true; // abre el dialog al seleccionar proveedor
}

}
