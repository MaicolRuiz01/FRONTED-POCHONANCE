import { Component, OnInit } from '@angular/core';
import { AccountCopService, AccountCop, AccountCopCreate } from '../../../../../../src/app/core/services/account-cop.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MovimientoService } from '../../../../../../src/app/core/services/movimiento.service';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-cuentas-tab',
  standalone: true,
  imports: [DialogModule, 
    ButtonModule, 
    FormsModule, 
    TableModule, 
    InputTextModule, 
    CardModule, 
    CommonModule,
    DropdownModule
   ],
  templateUrl: './cuentas-tab.component.html',
  styleUrls: ['./cuentas-tab.component.css']
})
export class CuentasTabComponent implements OnInit {
  cuentas: AccountCop[] = [];
  newAccount: AccountCopCreate = { name: '', balance: 0 };
  displayDialog: boolean = false;

  selectedCuentaOrigenId?: number;
selectedCuentaDestinoId?: number;
montoMovimiento?: number;
displayDialogRetiro: boolean = false;
displayDialogDeposito: boolean = false;
displayDialogTransferencia: boolean = false;


  constructor(private accountService: AccountCopService,private movimientoService: MovimientoService,private router: Router) {}

  ngOnInit(): void {
    this.loadCuentas();
  }
  goToVentas(accountId: number) {
  this.router.navigate(['/cuentas', accountId, 'ventas']);
}

  loadCuentas() {
    this.accountService.getAll().subscribe({
      next: (cuentas: AccountCop[]) => {
        console.log('Cuentas recibidas:', cuentas);
        this.cuentas = cuentas;
      },
      error: (err: any) => {
        console.error('Error al cargar cuentas:', err.message, err);
      }
    });
    
  }

  createAccount() {
    console.log('Creating Account:', this.newAccount);
    this.accountService.create(this.newAccount).subscribe(account => {
      this.cuentas.push(account);
      this.displayDialog = false;
      this.newAccount = { name: '', balance: 0 }; // Reseteo sin ID
    }, error => {
      console.error('Error creating account', error);
    });
  }

  showCreateDialog() {
    this.displayDialog = true;
  }

  abrirDialogRetiro() {
  this.displayDialogRetiro = true;
  this.selectedCuentaOrigenId = undefined;
  this.montoMovimiento = undefined;
}

abrirDialogDeposito() {
  this.displayDialogDeposito = true;
  this.selectedCuentaDestinoId = undefined;
  this.montoMovimiento = undefined;
}

abrirDialogTransferencia() {
  this.displayDialogTransferencia = true;
  this.selectedCuentaOrigenId = undefined;
  this.selectedCuentaDestinoId = undefined;
  this.montoMovimiento = undefined;
}

registrarRetiro() {
  if (!this.selectedCuentaOrigenId || !this.montoMovimiento) return;

  this.movimientoService.registrarRetiro(this.selectedCuentaOrigenId, this.montoMovimiento)
    .subscribe(() => {
      this.displayDialogRetiro = false;
      this.loadCuentas();
    });
}

registrarDeposito() {
  if (!this.selectedCuentaDestinoId || !this.montoMovimiento) return;

  this.movimientoService.registrarDeposito(this.selectedCuentaDestinoId, this.montoMovimiento)
    .subscribe(() => {
      this.displayDialogDeposito = false;
      this.loadCuentas();
    });
}

registrarTransferencia() {
  if (!this.selectedCuentaOrigenId || !this.selectedCuentaDestinoId || !this.montoMovimiento) return;

  this.movimientoService.registrarTransferencia(
    this.selectedCuentaOrigenId,
    this.selectedCuentaDestinoId,
    this.montoMovimiento
  ).subscribe(() => {
    this.displayDialogTransferencia = false;
    this.loadCuentas();
  });
}
}