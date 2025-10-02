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
import { CajaService, Caja } from '../../../../core/services/caja.service'; // ✅ Necesitas este servicio para cargar la caja
import { MovimientoService } from '../../../../core/services/movimiento.service';

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

  movimientos: any[] = [];

  Supplier_name: string = '';
  Supplier_balance: number = 0; // nuevo, balance por defecto
  SupplierlastPaymentDate: Date = new Date(); // nuevo, fecha por defecto

  cajas: any[] = [];
  selectedCaja: any | null = null;
  paymentMethod: string = 'Cuenta Bancaria';

  constructor(
    private supplierService: SupplierService,
    private accountCopService: AccountCopService,
    private paymentService: PagoProveedorService,
    private cajaService: CajaService,
    private movimientoService: MovimientoService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.accountCopService.getAll().subscribe(accountCops => this.accountCops = accountCops);
    this.cajaService.listar().subscribe(cajas => this.cajas = cajas);
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
  loadMovimientosBySupplier(): void {
    if (this.selectedSupplier) {
      const supplierId = this.selectedSupplier.id;
       console.log('Cargando movimientos para el proveedor ID:', supplierId);
       console.log('Proveedor seleccionado:', this.movimientos);
      this.paymentService.getMovimientosBySupplier(supplierId).subscribe({
        next: (data) => this.movimientos = data,
        error: (err) => console.error('Error cargando movimientos', err)
        
      });
    }
  }

  // Llamar al servicio para realizar el pago
  makePayment(): void {
    const supplierId = Number(this.selectedSupplier?.id ?? 0);
    if (supplierId === 0) {
      console.error('Proveedor no seleccionado');
      return;
    }

    let cuentaId: number | null = null;
    let cajaId: number | null = null;

    if (this.paymentMethod === 'Cuenta Bancaria') {
      cuentaId = Number(this.selectedAccountCop?.id ?? 0);
      if (cuentaId === 0) {
        console.error('Cuenta COP no seleccionada');
        return;
      }
    } else if (this.paymentMethod === 'Caja') {
      cajaId = Number(this.selectedCaja?.id ?? 0);
      if (cajaId === 0) {
        console.error('Caja no seleccionada');
        return;
      }
    }

    // ✅ Llamar al servicio con los parámetros correctos
    this.movimientoService.registrarPagoProveedor(cuentaId, cajaId, supplierId, this.amount)
      .subscribe(
        response => {
          console.log('Pago realizado exitosamente', response);
          this.loadSuppliers();
          this.togglePaymentForm();
        },
        error => {
          console.error('Error realizando el pago:', error);
        }
      );
  }

  togglePaymentForm(): void {
    this.showPaymentForm = !this.showPaymentForm;
    // ✅ Restablecer los valores al cerrar el formulario
    if (!this.showPaymentForm) {
      this.selectedAccountCop = null;
      this.selectedCaja = null;
      this.selectedSupplier = null;
      this.amount = 0;
      this.paymentMethod = 'Cuenta Bancaria';
    }
  }

onSelectSupplier(supplier: Supplier): void {
    this.selectedSupplier = supplier;
    this.loadMovimientosBySupplier(); // ✅ Ahora llama al nuevo método
    this.showPagosDialog = true;
  }

}
