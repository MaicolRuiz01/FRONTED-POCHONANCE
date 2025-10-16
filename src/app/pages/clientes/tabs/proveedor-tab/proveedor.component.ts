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
import { ClienteService } from '../../../../core/services/cliente.service';

export interface PagoProveedorDTO {
    id: number;
    amount: number;
    date: Date; // O string, dependiendo de cómo lo serialice Java
    accountOriginName: string;
    accountDestinyName: string;
    type: 'INGRESO' | 'EGRESO';
}



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
  Math = Math;
  suppliers: Supplier[] = [];
  accountCops: AccountCop[] = [];
  selectedAccountCop: AccountCop | null = null;
  selectedSupplier: Supplier | null = null;
  amount: number = 0;
  showPaymentForm: boolean = false;
  pagos: any[] = []; // Variable para almacenar los pagos del proveedor
  showPagosDialog: boolean = false; // nuevo
  showform: boolean = false; // nuevo
  selectedProveedorOrigen: Supplier | null = null;

  movimientos: any[] = [];

  Supplier_name: string = '';
  Supplier_balance: number = 0; // nuevo, balance por defecto
  SupplierlastPaymentDate: Date = new Date(); // nuevo, fecha por defecto

  cajas: any[] = [];
  selectedCaja: any | null = null;
  paymentMethod: string = 'Cuenta Bancaria';
  paymentOptions = ['Cuenta Bancaria', 'Caja', 'Proveedor','Cliente'];
  selectedCliente: any | null = null;
clientes: any[] = [];

  constructor(
    private supplierService: SupplierService,
    private accountCopService: AccountCopService,
    private paymentService: PagoProveedorService,
    private cajaService: CajaService,
    private movimientoService: MovimientoService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.accountCopService.getAll().subscribe(accountCops => this.accountCops = accountCops);
    this.cajaService.listar().subscribe(cajas => this.cajas = cajas);
    this.clienteService.listar().subscribe(clientes => this.clientes = clientes);
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
  const proveedorDestinoId = Number(this.selectedSupplier?.id ?? 0);
  if (proveedorDestinoId === 0) {
    console.error('Proveedor destino no seleccionado');
    return;
  }

  let cuentaId: number | null = null;
  let cajaId: number | null = null;
  let proveedorOrigenId: number | null = null;
  let clienteId: number | null = null;

  if (this.paymentMethod === 'Cuenta Bancaria') {
    cuentaId = Number(this.selectedAccountCop?.id ?? 0);
    if (cuentaId === 0) return console.error('Cuenta COP no seleccionada');
  } else if (this.paymentMethod === 'Caja') {
    cajaId = Number(this.selectedCaja?.id ?? 0);
    if (cajaId === 0) return console.error('Caja no seleccionada');
  } else if (this.paymentMethod === 'Proveedor') {
    proveedorOrigenId = Number(this.selectedProveedorOrigen?.id ?? 0);
    if (proveedorOrigenId === 0) return console.error('Proveedor origen no seleccionado');
  } else if (this.paymentMethod === 'Cliente') {
    clienteId = Number(this.selectedCliente?.id ?? 0);
    if (clienteId === 0) return console.error('Cliente no seleccionado');
  }

  this.movimientoService.registrarPagoProveedor(
    cuentaId,
    cajaId,
    proveedorOrigenId,
    proveedorDestinoId,
    this.amount,
    clienteId // 🔹 aquí pasas el cliente si existe
  ).subscribe({
    next: (response) => {
      console.log('✅ Pago realizado exitosamente', response);
      this.loadSuppliers();
      this.togglePaymentForm();
    },
    error: (err) => console.error('❌ Error realizando el pago:', err)
  });
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
