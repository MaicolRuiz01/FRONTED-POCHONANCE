import { Component, OnInit } from '@angular/core';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { ButtonProps } from 'primeng/splitbutton';
import { DropdownModule } from 'primeng/dropdown';

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
    DropdownModule
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  displayModal = false;
  nuevoCliente: Partial<Cliente> = { nombre: '', correo: '', nameUser: '', saldo: 0 , wallet: ''};

  displayPagoModal = false;

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: data => this.clientes = data,
      error: () => alert('Error al cargar los clientes')
    });
  }

  get totalClientes(): number {
    return this.clientes.reduce((acc, cliente) => acc + (cliente.saldo ?? 0), 0);
  }

  abrirModal(): void {
    this.nuevoCliente = { nombre: '', correo: '', nameUser: '', saldo: 0 , wallet: ''};
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

  pagarCliente(cliente: Cliente, monto: number): void {
    if (monto <= 0 || monto > (cliente.saldo ?? 0)) {
      alert('Monto inválido');
      return;
    }
}

pago: { origenId: number | null, destinoId: number | null, monto: number | null, nota?: string } = {
  origenId: null,
  destinoId: null,
  monto: null,
  nota: ''
};

abrirModalPago(): void {
  this.pago = { origenId: null, destinoId: null, monto: null, nota: '' };
  this.displayPagoModal = true;
  console.log("Modal de pago abierto");
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

  // Aquí iría la llamada al backend
  /*
  this.clienteService.transferir(this.pago).subscribe({
    next: () => {
      alert('Pago realizado con éxito');
      this.displayPagoModal = false;
      this.cargarClientes(); // recargar lista
    },
    error: () => alert('Error al procesar el pago')
  });
  */
}


}