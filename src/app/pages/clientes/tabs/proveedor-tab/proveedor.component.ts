import { Component, OnInit } from '@angular/core';
import { SupplierService, Supplier } from '../../../../core/services/supplier.service';
import { Movimiento, PagoProveedorService } from '../../../../core/services/pago-proveedor.service';
import { AccountCopService, AccountCop } from '../../../../core/services/account-cop.service';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ListaPagosComponent } from './lista-pagos/lista-pagos.component';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { CajaService, Caja } from '../../../../core/services/caja.service';
import { MovimientoService, MovimientoAjusteDto } from '../../../../core/services/movimiento.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { TabViewModule } from 'primeng/tabview';
import { BuyDollarsService, BuyDollarsDto } from '../../../../core/services/buy-dollars.service';
import { TableModule } from 'primeng/table';
import { AjusteSaldoDialogComponent } from '../../../../shared/ajustes-saldo/ajuste-saldo-dialog.component';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Output, EventEmitter } from '@angular/core';

export interface PagoProveedorDTO {
  id: number;
  amount: number;
  date: Date;
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
    CalendarModule,
    TabViewModule,
    TableModule,
    AjusteSaldoDialogComponent,
    SelectButtonModule
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
  supplierSaldoTipo: 'DEBEMOS' | 'NOS_DEBEN' = 'DEBEMOS';
  movimientos: any[] = [];
  @Output() totalChange = new EventEmitter<number>();

  Supplier_name: string = '';
  Supplier_balance: number = 0; // nuevo, balance por defecto


  cajas: any[] = [];
  selectedCaja: any | null = null;
  paymentMethod: string = 'Cuenta Bancaria';
  paymentOptions = ['Cuenta Bancaria', 'Caja', 'Proveedor', 'Cliente'];
  selectedCliente: any | null = null;
  comprasProveedor: BuyDollarsDto[] = [];
  loadingMovs = false;
  loadingCompras = false;
  clientes: any[] = [];

  displayPagoPCModal = false;

  pagoPC = {
    proveedorId: null as number | null,  // origen
    clienteId: null as number | null,  // destino
    usdt: null as number | null,
    tasaProv: null as number | null,  // COP/USDT del proveedor (origen)
    tasaCli: null as number | null,  // COP/USDT del cliente (destino)
    nota: '' as string
  };

  showAjusteProveedor = false;
  proveedorAjuste: Supplier | null = null;
  ajustesProveedor: MovimientoAjusteDto[] = [];
  loadingAjustes = false;

  constructor(
    private supplierService: SupplierService,
    private accountCopService: AccountCopService,
    private paymentService: PagoProveedorService,
    private cajaService: CajaService,
    private movimientoService: MovimientoService,
    private clienteService: ClienteService,
    private buyDollarsService: BuyDollarsService
  ) { }

  ngOnInit(): void {
    this.loadSuppliers();
    this.accountCopService.getAll().subscribe(accountCops => this.accountCops = accountCops);
    this.cajaService.listar().subscribe(cajas => this.cajas = cajas);
    this.clienteService.listar().subscribe(clientes => this.clientes = clientes);
  }

  get pesosProvPC(): number {
    const u = this.pagoPC.usdt ?? 0;
    const t = this.pagoPC.tasaProv ?? 0;
    return u * t;
  }
  get pesosCliPC(): number {
    const u = this.pagoPC.usdt ?? 0;
    const t = this.pagoPC.tasaCli ?? 0;
    return u * t;
  }

  abrirAjusteProveedor(supplier: Supplier) {
    this.proveedorAjuste = supplier;
    this.showAjusteProveedor = true;
  }

  onAjusteProveedorRealizado() {
    this.loadSuppliers(); // recarga los saldos después del ajuste
  }


  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.emitTotal();
        this.suppliers.forEach(s => {
          if (!s.id) return;
          this.movimientoService.getResumenProveedor(s.id).subscribe({
            next: (res) => {
              s.entradasHoy = res.entradasHoy;
              s.salidasHoy = res.salidasHoy;
              s.ajustesHoy = res.ajustesHoy;
              s.comprasHoy = res.comprasDolaresHoy;  // BuyDollars del día (COP)
              s.ventasHoy = res.ventasDolaresHoy;   // SellDollars del día (COP)
            }
          });
        });

      },
      error: (err) => console.error('Error loading suppliers', err)
    });
  }

  get totalProveedores(): number {
    return this.suppliers.reduce((acc, supplier) => acc + (supplier.balance ?? 0), 0);
  }

  showAllSuppliers(): void {
    this.loadSuppliers();
  }


  createSupplier(data: any): void {
  const monto = Math.abs(Number(data.balance || 0));
  const balanceSigned = this.supplierSaldoTipo === 'DEBEMOS' ? monto : -monto;

  this.supplierService.createSupplier({
    name: data.name,
    balance: balanceSigned
  }).subscribe({
    next: (supplier) => {
      this.suppliers.push(supplier);

      // reset
      this.Supplier_name = '';
      this.Supplier_balance = 0;
      this.supplierSaldoTipo = 'DEBEMOS';

      // actualiza total en wrapper
      this.emitTotal();

      // (opcional) si prefieres datos 100% frescos:
      // this.loadSuppliers();
    },
    error: (err) => {
      console.error('Error creating supplier', err);

      // (opcional) si falló, reabre el dialog
      // this.showform = true;
    }
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
    this.movimientos = [];
    this.comprasProveedor = [];
    this.showPagosDialog = true;

    if (!supplier?.id) return;

    // Movimientos
    this.loadingMovs = true;
    this.paymentService.getMovimientosBySupplier(supplier.id).subscribe({
      next: data => this.movimientos = data,
      error: err => console.error('Error cargando movimientos', err),
      complete: () => this.loadingMovs = false
    });

    // Compras (BuyDollars)
    this.loadingCompras = true;
    this.buyDollarsService.getComprasPorProveedor(supplier.id).subscribe({
      next: compras => {
        // Si el backend ya viene ordenado, esto es opcional:
        this.comprasProveedor = [...compras].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
      error: err => console.error('Error cargando compras proveedor', err),
      complete: () => this.loadingCompras = false
    });

    this.loadingAjustes = true;
    this.movimientoService.getAjustesProveedor(supplier.id).subscribe({
      next: ajustes => {
        this.ajustesProveedor = [...ajustes].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: err => console.error('Error cargando ajustes proveedor', err),
      complete: () => this.loadingAjustes = false
    });
  }


  abrirModalPagoProveedorCliente(): void {
    this.pagoPC = {
      proveedorId: this.selectedSupplier?.id ?? null, // si ya hay proveedor seleccionado, precárgalo
      clienteId: null,
      usdt: null,
      tasaProv: null,
      tasaCli: null,
      nota: ''
    };
    this.displayPagoPCModal = true;
  }

  confirmarPagoProveedorCliente(): void {
    const { proveedorId, clienteId, usdt, tasaProv, tasaCli, nota } = this.pagoPC;
    if (!proveedorId || !clienteId || !usdt || !tasaProv || !tasaCli) return;

    this.movimientoService.pagoProveedorACliente({
      proveedorOrigenId: proveedorId,
      clienteDestinoId: clienteId,
      usdt: usdt,
      tasaProveedor: tasaProv,
      tasaCliente: tasaCli,
      nota
    }).subscribe({
      next: () => {
        this.displayPagoPCModal = false;
        this.loadSuppliers();  // refresca saldos
        if (this.selectedSupplier?.id) this.onSelectSupplier(this.selectedSupplier); // refresca dialog abierto
      },
      error: (err) => console.error('Error en pago Proveedor→Cliente', err)
    });
  }


  eliminarMovimiento(movimiento: Movimiento): void {
    this.movimientoService.eliminarMovimiento(movimiento).subscribe({
      next: () => {
        console.log('✅ Movimiento eliminado exitosamente');
        this.loadMovimientosBySupplier(); // Recargar movimientos
      },
      error: (err) => console.error('❌ Error eliminando movimiento:', err)
    });
  }

  downloadExcel(supplier: Supplier, event?: Event) {
    event?.stopPropagation(); // para que no abra el dialog al darle click

    if (!supplier?.id) return;

    this.movimientoService.downloadExcelProveedor(supplier.id).subscribe({
      next: (blob) => {
        const fileName = `proveedor_${supplier.id}_${supplier.name}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error descargando excel', err)
    });
  }

  showFormsupplier(): void {
    this.showform = !this.showform;
    if (this.showform) {
      this.Supplier_name = '';
      this.Supplier_balance = 0;
      this.supplierSaldoTipo = 'DEBEMOS';
    }
  }
  private emitTotal() {
    this.totalChange.emit(Number(this.totalProveedores ?? 0));
  }
  onCrearProveedorClick(): void {
  // cierra de una
  this.showform = false;

  // llama tu creación
  this.createSupplier({
    name: this.Supplier_name,
    balance: this.Supplier_balance
  });
}


}
