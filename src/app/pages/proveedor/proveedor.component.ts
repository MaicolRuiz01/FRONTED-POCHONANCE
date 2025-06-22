import { Component, OnInit } from '@angular/core';
import { SupplierService, Supplier } from '../../core/services/supplier.service';
import { PagoProveedorService } from '../../core/services/pago-proveedor.service';
import { AccountCopService, AccountCop } from '../../core/services/account-cop.service';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';  
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ListaPagosComponent } from './lista-pagos/lista-pagos.component';
import { CardModule } from 'primeng/card'; // Importa el componente ListaPagos
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    FormsModule,
    DialogModule,
    ListaPagosComponent,
    CardModule,
    CommonModule   // Asegúrate de que este componente esté importado
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
