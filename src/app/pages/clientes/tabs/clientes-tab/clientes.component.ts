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
import { MovimientoService } from '../../../../core/services/movimiento.service';
import { TabViewModule } from 'primeng/tabview';
import { BuyDollarsService, BuyDollarsDto } from '../../../../core/services/buy-dollars.service';


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
    TableModule
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

  displayPagoModal = false;
  displayTransferModal = false;

  tasaOrigen = 0;
  tasaDestino = 0;

  showMovimientosDialog: boolean = false;
  selectedCliente: Cliente | null = null;
  clienteMovimientos: any[] = [];

  displayEditModal = false;
  editCliente: Cliente | null = null;
  

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
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarProveedores();
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: data => this.clientes = data,
      error: () => alert('Error al cargar los clientes')
    });
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
    error: (err) => {
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
    this.pago = { origenId: null, destinoId: null, monto: null, nota: '' };
    this.pagoUsdt = null;
    this.tasaOrigen = 0;
    this.tasaDestino = 0;
    this.displayPagoModal = true;
  }

  confirmarPago(): void {
    const origen = this.clientes.find(c => c.id === this.pago.origenId);
    const destino = this.clientes.find(c => c.id === this.pago.destinoId);

    if (!origen || !destino) { alert('Debe seleccionar ambos clientes'); return; }
    if (origen.id === destino.id) { alert('El origen y destino no pueden ser el mismo'); return; }
    if (!this.pagoUsdt || this.pagoUsdt <= 0) { alert('Ingrese el monto en USDT'); return; }
    if (!this.tasaOrigen || this.tasaOrigen <= 0) { alert('Tasa de Origen inválida'); return; }
    if (!this.tasaDestino || this.tasaDestino <= 0) { alert('Tasa de Destino inválida'); return; }

    

    this.loadingPago = true;
    this.movimientoService.pagoClienteACliente({
      clienteOrigenId: origen.id!,
      clienteDestinoId: destino.id!,
      usdt: this.pagoUsdt!,
      tasaOrigen: this.tasaOrigen!,
      tasaDestino: this.tasaDestino!,
      nota: this.pago.nota || ''
    }).subscribe({
      next: () => {
        alert('Pago C2C realizado con éxito');
        this.displayPagoModal = false;
        this.loadingPago = false;
        this.cargarClientes();
      },
      error: (err) => {
        this.loadingPago = false;
        const msg = err?.error?.message || 'Error al procesar el pago C2C';
        alert(msg);
        console.error(err);
      }
    });
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
    },
    error: (err) => console.error('Error al cargar historial de movimientos', err),
  });

  // 👇 Compras asignadas al cliente
  this.buyDollarsService.getComprasPorCliente(cliente.id).subscribe({
    next: (compras) => {
      // Si necesitas orden, el backend ya lo puede traer desc; si no:
      this.comprasCliente = [...compras].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
    error: (err) => console.error('Error al cargar compras del cliente', err),
  });

  this.showMovimientosDialog = true;
}



}
