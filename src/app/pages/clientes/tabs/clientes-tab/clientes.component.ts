import { Component, OnInit } from '@angular/core';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { SupplierService } from '../../../../core/services/supplier.service';
import { MessageService } from 'primeng/api';
import { MovimientoService, MovimientoAjusteDto } from '../../../../core/services/movimiento.service';
import { TabViewModule } from 'primeng/tabview';
import { BuyDollarsService, BuyDollarsDto } from '../../../../core/services/buy-dollars.service';
import { SellDollar, SellDollarsService } from '../../../../core/services/sell-dollars.service';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Movimiento } from '../../../../core/services/pago-proveedor.service';
import { AjusteSaldoDto } from '../../../../core/services/movimiento.service';
import { AccountCopService, AccountCop } from '../../../../core/services/account-cop.service';
import { AjusteSaldoDialogComponent } from '../../../../shared/ajustes-saldo/ajuste-saldo-dialog.component';

import { AjustesService } from '../../../../core/services/ajustes.service';
import { AjustesComponent } from '../../../activadades/Ajustes/ajustes.component';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    InputNumberModule,
    CardModule,
    DropdownModule,
    TabViewModule,
    TableModule,
    SelectButtonModule,
    AjusteSaldoDialogComponent
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
  providers: [MessageService]
})
export class ClientesComponent implements OnInit {
  Math = Math;
  clientes: Cliente[] = [];
  proveedores: any[] = [];
  movimientos: any[] = [];
  displayModal = false;
  nuevoCliente: Partial<Cliente> = { nombre: '', correo: '', nameUser: '', saldo: 0, wallet: '' };
  comprasCliente: BuyDollarsDto[] = [];
  displayPagoCPModal = false;

  displayPagoModal = false;
  displayTransferModal = false;

  tasaOrigen = 0;
  tasaDestino = 0;
  cuentasCop: AccountCop[] = [];   // 🔹 cuentas COP que vienen del backend
  displayPagoCuentaCopModal = false;

  pagoCuentaCop = {
    cuentaId: null as number | null,
    clienteDestinoId: null as number | null,
    monto: null as number | null
  };

  comprausdt: number | null = null;
  ventausdt: number | null = null;


  formValues = {
    usuariocl_id: null
  };
  
  showMovimientosDialog: boolean = false;
  selectedCliente: Cliente | null = null;
  clienteMovimientos: any[] = [];


  clienteAjustes: any[] = [];
  ajustesSeleccionado: any[] = [];

  displayEditModal = false;
  editCliente: Cliente | null = null;
  ventasCliente: SellDollar[] = [];
  // modo de pago: 'USDT' o 'COP'
  paymentMode: 'USDT' | 'COP' = 'USDT';

  // Monto COP cuando el modo es COP
  pagoCop: number | null = null;


  transferencia: { clientId: number | null, supplierId: number | null, amount: number | null } = {
    clientId: null,
    supplierId: null,
    amount: null
  };

  pago: { origenId: number | null, destinoId: number | null, monto: number | null, nota?: string } = {
    origenId: null,
    destinoId: null,
    monto: null,
    nota: ''
  };

  loadingPago = false;

  pagoUsdt: number | null = null;

  showAjusteCliente = false;
  clienteAjuste: Cliente | null = null;
  nuevoSaldoAjuste: number | null = null;
  motivoAjuste: string = '';
  accountCopService: any;
  showexcelmodal: boolean = false;

  ajustesCliente: MovimientoAjusteDto[] = [];
  loadingAjustesCliente = false;


  get pesosOrigen(): number {
    return (this.pagoUsdt ?? 0) * (this.tasaOrigen ?? 0);
  }
  get pesosDestino(): number {
    return (this.pagoUsdt ?? 0) * (this.tasaDestino ?? 0);
  }
  constructor(
    private clienteService: ClienteService,
    private supplierService: SupplierService,
    private movimientoService: MovimientoService,
    private messageService: MessageService,
    private buyDollarsService: BuyDollarsService,
    private sellDollarsService: SellDollarsService,
    private ajustesService: AjustesService
  ) { }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarProveedores();
    this.cargarCuentasCop();
  }
  cargarCuentasCop(): void {
    this.accountCopService.getAll().subscribe({
      next: (data: AccountCop[]) => this.cuentasCop = data,
      error: (err: any) => {
        console.error('Error al cargar cuentas COP', err);
        alert('Error al cargar cuentas COP');
      }
    });
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: data => {
        this.clientes = data;

        // para cada cliente, pido su resumen del día
        this.clientes.forEach(c => {
          if (!c.id) return;
          this.movimientoService.getResumenCliente(c.id).subscribe({
            next: (res) => {
              c.comprasHoy = res.comprasHoy;
              c.ventasHoy = res.ventasHoy;
              c.ajustesHoy = res.ajustesHoy;
            }
          });
        });
      },
      error: () => alert('Error al cargar los clientes')
    });
  }


  abrirAjusteCliente(cliente: Cliente) {
    this.clienteAjuste = cliente;
    this.showAjusteCliente = true;
  }
  onAjusteClienteRealizado() {
    this.cargarClientes();
  }

  abrirModalPagoCuentaCop(): void {
    this.pagoCuentaCop = {
      cuentaId: null,
      clienteDestinoId: null,
      monto: null
    };
    this.displayPagoCuentaCopModal = true;
  }



  cargarProveedores(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: data => this.proveedores = data,
      error: () => alert('Error al cargar los proveedores')
    });
  }
  abrirModalEditar(cliente: Cliente): void {
    // clona para no tocar el card hasta guardar
    this.editCliente = { ...cliente };
    this.displayEditModal = true;
  }

  guardarEdicion(): void {
    if (!this.editCliente) return;

    // Solo exigir Nombre (correo opcional)
    if (!this.editCliente.nombre?.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    this.clienteService.actualizar(this.editCliente).subscribe({
      next: () => {
        this.displayEditModal = false;
        this.editCliente = null;
        this.cargarClientes();
      },
      error: (err: any) => {
        console.error('Error al actualizar cliente', err);
        alert('No se pudo actualizar el cliente');
      }
    });
  }

  cancelarEdicion(): void {
    this.displayEditModal = false;
    this.editCliente = null;
  }


  get totalClientes(): number {
    return this.clientes.reduce((acc, cliente) => acc + (cliente.saldo ?? 0), 0);
  }

  abrirModal(): void {
    this.nuevoCliente = { nombre: '', correo: '', nameUser: '', saldo: 0, wallet: '' };
    this.displayModal = true;
  }

  guardarCliente(): void {
    this.clienteService.crear(this.nuevoCliente).subscribe({
      next: () => {
        this.displayModal = false;
        this.cargarClientes();
      },
      error: () => alert('Error al guardar el cliente')
    });
  }

  abrirModalPago(): void {
    this.paymentMode = 'USDT';
    this.pago = { origenId: null, destinoId: null, monto: null, nota: '' };
    this.pagoUsdt = null;
    this.pagoCop = null;
    this.tasaOrigen = 0;
    this.tasaDestino = 0;
    this.displayPagoModal = true;
  }


  confirmarPago(): void {
    const origen = this.clientes.find(c => c.id === this.pago.origenId);
    const destino = this.clientes.find(c => c.id === this.pago.destinoId);
    if (!origen || !destino) { alert('Debe seleccionar ambos clientes'); return; }
    if (origen.id === destino.id) { alert('El origen y destino no pueden ser el mismo'); return; }

    this.loadingPago = true;

    if (this.paymentMode === 'USDT') {
      // Validaciones USDT
      if (!this.pagoUsdt || this.pagoUsdt <= 0) { alert('Ingrese el monto en USDT'); this.loadingPago = false; return; }
      if (!this.tasaOrigen || this.tasaOrigen <= 0) { alert('Tasa de Origen inválida'); this.loadingPago = false; return; }
      if (!this.tasaDestino || this.tasaDestino <= 0) { alert('Tasa de Destino inválida'); this.loadingPago = false; return; }

      this.movimientoService.pagoClienteACliente({
        clienteOrigenId: origen.id!,
        clienteDestinoId: destino.id!,
        usdt: this.pagoUsdt!,
        tasaOrigen: this.tasaOrigen!,
        tasaDestino: this.tasaDestino!,
        nota: this.pago.nota || ''
      }).subscribe({
        next: () => {
          alert('Pago C2C (USDT) realizado con éxito');
          this.displayPagoModal = false;
          this.loadingPago = false;
          this.cargarClientes();
        },
        error: (err: any) => {
          this.loadingPago = false;
          const msg = err?.error?.message || 'Error al procesar el pago C2C (USDT)';
          alert(msg);
          console.error(err);
        }
      });

    } else {
      // Modo COP
      if (!this.pagoCop || this.pagoCop <= 0) { alert('Ingrese el monto en COP'); this.loadingPago = false; return; }

      this.movimientoService
        .pagoClienteAClienteCop(origen.id!, destino.id!, this.pagoCop!)
        .subscribe({
          next: () => {
            alert('Pago C2C (COP) realizado con éxito');
            this.displayPagoModal = false;
            this.loadingPago = false;
            this.cargarClientes();
          },
          error: (err: any) => {
            this.loadingPago = false;
            const msg = err?.error?.message || 'Error al procesar el pago C2C (COP)';
            alert(msg);
            console.error(err);
          }
        });
    }
  }


  abrirModalTransferencia(): void {
    this.transferencia = { clientId: null, supplierId: null, amount: null };
    this.displayTransferModal = true;
  }

  confirmarTransferencia(): void {
    if (!this.transferencia.clientId || !this.transferencia.supplierId || !this.transferencia.amount) {
      alert('Debe completar todos los campos');
      return;
    }

    this.supplierService.transferirClienteProveedor({
      clientId: this.transferencia.clientId!,
      supplierId: this.transferencia.supplierId!,
      amount: this.transferencia.amount!
    }).subscribe({
      next: () => {
        alert('Transferencia realizada con éxito');
        this.displayTransferModal = false;
        this.cargarClientes();
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : 'Error al procesar la transferencia';
        alert(msg);
        console.log(err);
      }
    });
  }


  onSelectCliente(cliente: Cliente): void {
    this.selectedCliente = cliente;
    this.clienteMovimientos = [];
    this.comprasCliente = [];
    this.ventasCliente = [];
    this.selectedCliente = cliente;
    this.clienteMovimientos = [];
    this.comprasCliente = [];
    this.ventasCliente = [];
    this.ajustesSeleccionado = [];
    this.clienteAjustes = [];

    if (!cliente.id) {
      this.showMovimientosDialog = true;
      return;
    }

    // Movimientos (ya lo tenías)
    this.movimientoService.getMovimientosPorCliente(cliente.id).subscribe({
      next: (data) => {
        this.clienteMovimientos = [...data].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        console.log('Movimientos del cliente:', this.clienteMovimientos);
      },
      error: (err) => console.error('Error al cargar historial de movimientos', err),
    });

    this.buyDollarsService.getComprasPorCliente(cliente.id).subscribe({
      next: (compras) => {
        this.comprasCliente = [...compras].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
      error: (err) => console.error('Error al cargar compras del cliente', err),
    });

    this.sellDollarsService.getVentasPorCliente(cliente.id).subscribe({
      next: (ventas) => {
        this.ventasCliente = [...ventas].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
      error: (err) => console.error('Error al cargar ventas del cliente', err),
    });

    this.loadingAjustesCliente = true;
    this.movimientoService.getAjustesCliente(cliente.id).subscribe({
      next: (ajustes) => {
        this.ajustesCliente = [...ajustes].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: (err) => console.error('Error al cargar ajustes del cliente', err),
      complete: () => this.loadingAjustesCliente = false
    });

    // 👇 Ajustes asignados al cliente
    this.ajustesService.obtenerporcliente(cliente.id).subscribe({
      next: data => {
        console.log("Ajustes recibidos:", data);
        this.clienteAjustes = data;
        this.ajustesSeleccionado = [];
      },
      error: () => alert('Error al cargar los ajustes del cliente')
    });




    this.showMovimientosDialog = true;
  }

  pagoCP = {
    clienteId: null as number | null,
    proveedorId: null as number | null,
    usdt: null as number | null,
    tasaCliente: null as number | null,
    tasaProveedor: null as number | null,
    nota: '' as string
  };

  // 🔢 calculados
  get pesosClienteCP(): number {
    const u = this.pagoCP.usdt ?? 0;
    const t = this.pagoCP.tasaCliente ?? 0;
    return u * t;
  }
  get pesosProveedorCP(): number {
    const u = this.pagoCP.usdt ?? 0;
    const t = this.pagoCP.tasaProveedor ?? 0;
    return u * t;
  }

  // 🟢 abrir modal
  abrirModalPagoClienteProveedor(): void {
    this.pagoCP = {
      clienteId: null,
      proveedorId: null,
      usdt: null,
      tasaCliente: null,
      tasaProveedor: null,
      nota: ''
    };
    this.displayPagoCPModal = true;
  }
  get puedeConfirmarPago(): boolean {
    const origenOk = !!this.pago.origenId;
    const destinoOk = !!this.pago.destinoId;
    if (!origenOk || !destinoOk) return false;

    if (this.paymentMode === 'USDT') {
      return !!this.pagoUsdt && this.pagoUsdt! > 0 &&
        !!this.tasaOrigen && this.tasaOrigen! > 0 &&
        !!this.tasaDestino && this.tasaDestino! > 0;
    } else {
      return !!this.pagoCop && this.pagoCop! > 0;
    }
  }

  // ✅ confirmar pago
  confirmarPagoClienteProveedor(): void {
    const { clienteId, proveedorId, usdt, tasaCliente, tasaProveedor } = this.pagoCP;

    if (!clienteId || !proveedorId) { alert('Seleccione cliente y proveedor'); return; }
    if (!usdt || usdt <= 0) { alert('Ingrese monto USDT > 0'); return; }
    if (!tasaCliente || tasaCliente <= 0) { alert('Tasa cliente inválida'); return; }
    if (!tasaProveedor || tasaProveedor <= 0) { alert('Tasa proveedor inválida'); return; }

    this.loadingPago = true;

    this.movimientoService.pagoClienteAProveedor({
      clienteOrigenId: clienteId,
      proveedorDestinoId: proveedorId,
      usdt: usdt,
      tasaCliente: tasaCliente,
      tasaProveedor: tasaProveedor,
      nota: this.pagoCP.nota || ''
    }).subscribe({
      next: () => {
        alert('Pago Cliente → Proveedor realizado con éxito');
        this.displayPagoCPModal = false;
        this.loadingPago = false;
        this.cargarClientes(); // refresca saldos
      },
      error: (err) => {
        this.loadingPago = false;
        const msg = err?.error?.message || 'Error al procesar el pago Cliente → Proveedor';
        alert(msg);
        console.error(err);
      }
    });
  }

  eliminarMovimiento(movimiento: Movimiento): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este movimiento?')) return;
    this.movimientoService.eliminarMovimiento(movimiento).subscribe({
      next: () => {
        this.clienteMovimientos = this.clienteMovimientos.filter(m => m.id !== movimiento.id);
        this.comprasCliente = this.comprasCliente.filter(m => m.id !== movimiento.id);
        this.ventasCliente = this.ventasCliente.filter(m => m.id !== movimiento.id);
      },
      error: () => alert('Error al eliminar el movimiento')
    });
  }

  confirmarPagoCuentaCop(): void {
    const { cuentaId, clienteDestinoId, monto } = this.pagoCuentaCop;

    if (!cuentaId || !clienteDestinoId || !monto || monto <= 0) {
      alert('Complete todos los campos correctamente');
      return;
    }

    this.movimientoService
      .pagoCuentaCopACliente(cuentaId, clienteDestinoId, monto)
      .subscribe({
        next: () => {
          alert('Pago desde Cuenta COP realizado con éxito');
          this.displayPagoCuentaCopModal = false;
          this.cargarClientes();  // refresca saldos
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al procesar el pago desde Cuenta COP';
          alert(msg);
          console.error(err);
        }
      });
  }

  listarAjustesCliente(clienteId: number) {

  }

  abrirmodalexcel(): void {
    this.showexcelmodal = true;
  }

  cerrarmodalexcel(): void {
    this.showexcelmodal = false;
  }

  exportarExcelcliente(id: number | null): void {

    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) return;

    const nombreCliente = cliente.nombre.trim().toLowerCase();

    const movimientosFiltrados = this.clienteMovimientos.filter(mov =>
      mov.pagoCliente?.trim().toLowerCase().includes(nombreCliente)
    );

    this.sellDollarsService.getVentasPorCliente(id!).subscribe({
      next: (ventas) => {

        this.ventasCliente = [...ventas].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        this.buyDollarsService.getComprasPorCliente(id!).subscribe({
          next: (compras) => {

            this.comprasCliente = [...compras].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            console.log("Movimientos filtrados:", movimientosFiltrados);
            console.log("Compras del cliente:", this.comprasCliente);
            console.log("Ventas del cliente:", this.ventasCliente);

            if (
              movimientosFiltrados.length === 0 &&
              this.comprasCliente.length === 0 &&
              this.ventasCliente.length === 0
            ) {
              console.warn("No hay datos para exportar.");
              return;
            }

            // -----------------------------
            // 📘 CREAR EXCEL MULTIHOJA
            // -----------------------------
            const workbook = XLSX.utils.book_new();

            // 🟦 Hoja Movimientos
            const wsMov = XLSX.utils.json_to_sheet(movimientosFiltrados);
            XLSX.utils.book_append_sheet(workbook, wsMov, 'Movimientos');

            // 🟩 Hoja Compras
            const wsCompra = XLSX.utils.json_to_sheet(this.comprasCliente);
            XLSX.utils.book_append_sheet(workbook, wsCompra, 'Compras');

            // 🟥 Hoja Ventas
            const wsVenta = XLSX.utils.json_to_sheet(this.ventasCliente);
            XLSX.utils.book_append_sheet(workbook, wsVenta, 'Ventas');

            // Exportar archivo
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            saveAs(blob, `Reporte_${cliente.nombre}.xlsx`);
            this.showexcelmodal = false;

          },
          error: (err) => console.error('Error al cargar compras del cliente', err)
        });
      },
      error: (err) => console.error('Error al cargar ventas del cliente', err)
    });
  }
}