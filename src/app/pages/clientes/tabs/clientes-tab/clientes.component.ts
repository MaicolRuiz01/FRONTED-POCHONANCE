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
    TableModule
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
  providers: [MessageService]
})
export class ClientesComponent implements OnInit {

  clientes: Cliente[] = [];
  proveedores: any[] = [];
  displayModal = false;
  nuevoCliente: Partial<Cliente> = { nombre: '', correo: '', nameUser: '', saldo: 0, wallet: '' };

  displayPagoModal = false;
  displayTransferModal = false;

  tasaOrigen: number = 0;
  tasaDestino: number = 0;

  showMovimientosDialog: boolean = false;
  selectedCliente: Cliente | null = null;
  clienteMovimientos: any[] = [];

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

  constructor(
    private clienteService: ClienteService,
    private supplierService: SupplierService,
    private messageService: MessageService
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
    this.displayPagoModal = true;
  }

  confirmarPago(): void {
    const origen = this.clientes.find(c => c.id === this.pago.origenId);
    const destino = this.clientes.find(c => c.id === this.pago.destinoId);

    if (!origen || !destino) {
      alert('Debe seleccionar ambos clientes');
      return;
    }

    if (origen.id === destino.id) {
      alert('El cliente origen y destino no pueden ser el mismo');
      return;
    }

    if (!this.pago.monto || this.pago.monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    if ((origen.saldo ?? 0) < this.pago.monto) {
      alert('El cliente origen no tiene suficiente saldo');
      return;
    }

    if (!this.tasaOrigen || this.tasaOrigen <= 0) {
      alert('Debe ingresar una Tasa de Cliente Origen válida.');
      return;
    }
    if (!this.tasaDestino || this.tasaDestino <= 0) {
      alert('Debe ingresar una Tasa de Cliente Destino válida.');
      return;
    }

    this.loadingPago = true;
    this.clienteService.transferir({
      origenId: origen.id!,
      destinoId: destino.id!,
      monto: this.pago.monto!,
      nota: this.pago.nota || ''
    }).subscribe({
      next: () => {
        alert('Pago realizado con éxito');
        this.displayPagoModal = false;
        this.loadingPago = false;
        this.cargarClientes();
      },
      error: (err) => {
        this.loadingPago = false;
        const msg = typeof err?.error === 'string' ? err.error : 'Error al procesar el pago';
        alert(msg);
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

    if (cliente.id) {
      this.clienteService.historial(cliente.id).subscribe({
        next: (data) => this.clienteMovimientos = data,
        error: (err) => console.error('Error al cargar historial de movimientos', err)
      });
    }

    this.showMovimientosDialog = true;
  }
}
