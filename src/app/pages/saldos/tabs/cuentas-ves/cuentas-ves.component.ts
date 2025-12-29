import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

import {
  AccountVesService,
  AccountVes,
  AccountVesCreate
} from '../../../../core/services/AccountVes.service';

@Component({
  selector: 'app-cuentas-ves',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule
  ],
  templateUrl: './cuentas-ves.component.html',
  styleUrl: './cuentas-ves.component.css'
})
export class CuentasVesComponent implements OnInit {

  cuentas: AccountVes[] = [];
  displayDialog = false;

  newAccount: AccountVesCreate = {
    name: '',
    balance: 0
  };

  constructor(private accountVesService: AccountVesService) {}

  ngOnInit(): void {
    this.loadCuentas();
  }

  loadCuentas(): void {
    this.accountVesService.getAll().subscribe({
      next: cuentas => this.cuentas = cuentas,
      error: () => alert('Error al cargar cuentas VES')
    });
  }

  get totalCuentas(): number {
    return this.cuentas.reduce((acc, c) => acc + (c.balance || 0), 0);
  }

  abrirDialogCrear(): void {
    this.newAccount = { name: '', balance: 0 };
    this.displayDialog = true;
  }

  crearCuenta(): void {
    if (!this.newAccount.name || this.newAccount.balance == null) {
      alert('Nombre y balance son obligatorios');
      return;
    }

    this.accountVesService.create(this.newAccount).subscribe({
      next: () => {
        this.displayDialog = false;
        this.loadCuentas();
      },
      error: () => alert('Error al crear cuenta VES')
    });
  }

}
