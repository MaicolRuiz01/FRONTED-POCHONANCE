import { Component, OnInit } from '@angular/core';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    InputNumberModule
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  displayModal = false;
  nuevoCliente: Partial<Cliente> = { nombre: '', correo: '', nameUser: '', saldo: 0 , wallet: ''};

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
}
