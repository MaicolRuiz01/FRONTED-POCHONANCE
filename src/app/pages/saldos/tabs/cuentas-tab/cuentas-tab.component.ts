import { Component, OnInit } from '@angular/core';
import { AccountCopService, AccountCop, AccountCopCreate } from '../../../../core/services/account-cop.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MovimientoService } from '../../../../core/services/movimiento.service';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
import { CajaService, Caja } from '../../../../core/services/caja.service';
import { AjusteSaldoDialogComponent } from '../../../../shared/ajustes-saldo/ajuste-saldo-dialog.component';
import { GastoService } from '../../../../core/services/gasto.service';

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
    DropdownModule,
    InputNumberModule,
    AjusteSaldoDialogComponent
  ],
  templateUrl: './cuentas-tab.component.html',
  styleUrls: ['./cuentas-tab.component.css']
})
export class CuentasTabComponent implements OnInit {
  cuentas: AccountCop[] = [];
  newAccount: AccountCopCreate = { name: '', balance: 0 };
  displayDialog: boolean = false;
  clientes: Cliente[] = [];
  cajas: Caja[] = [];
  selectedCajaId?: number;


  selectedCuentaOrigenId?: number;
  selectedCuentaDestinoId?: number;
  montoMovimiento?: number;
  displayDialogRetiro: boolean = false;
  displayDialogDeposito: boolean = false;
  displayDialogTransferencia: boolean = false;
  selectedClienteId?: number;

  displayDialogPago: boolean = false;  // <-- faltaba declarar esto
  cuentaPagoId?: number;               // <-- también esta
  montoPago?: number;
  showAjusteCuenta = false;
  cuentaAjuste: AccountCop | null = null;


  constructor(private accountService: AccountCopService,
    private movimientoService: MovimientoService,
    private clienteService: ClienteService,
    private cajaService: CajaService,
    private gastoService: GastoService,
    private router: Router) { }

  ngOnInit(): void {
    this.loadCuentas();
    this.loadClientes();
    this.cajaService.listar().subscribe({
      next: data => this.cajas = data,
      error: () => alert('Error al cargar cajas')
    });
  }

  abrirAjusteCuenta(cuenta: AccountCop) {
    this.cuentaAjuste = cuenta;
    this.showAjusteCuenta = true;
  }

  onAjusteCuentaRealizado() {
    this.loadCuentas();
  }

  goToVentas(accountId: number) {
    this.router.navigate(['/cuentas', accountId, 'ventas']);
  }


  get totalCuentas(): number {
    return this.cuentas.reduce((acc, cuenta) => acc + (cuenta.balance ?? 0), 0);
  }

  loadCuentas() {
  this.accountService.getAll().subscribe({
    next: (cuentas: AccountCop[]) => {
      this.cuentas = cuentas;

      this.cuentas.forEach(c => {
        c.isFlipped = false;  // 👈 arranca siempre de frente

        if (!c.id) return;

        this.movimientoService.getResumenCuentaCop(c.id).subscribe(res => {
          c.entradasHoy       = res.entradasHoy;
          c.salidasHoy        = res.salidasHoy;
          c.ajustesHoy        = res.ajustesHoy;
          c.ventasDolaresHoy  = res.ventasDolaresHoy;
          c.salidasRetirosHoy = res.salidasRetirosHoy;
        });

        this.gastoService.getTotalGastosHoyCuentaCop(c.id).subscribe(total => {
          c.gastosHoy = total;
        });
      });
    }
  });
}




  loadClientes() {
    this.clienteService.listar().subscribe({
      next: data => this.clientes = data,
      error: () => alert('Error al cargar clientes')
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

  abrirDialogPago() {
    this.displayDialogPago = true;
    this.selectedClienteId = undefined;
    this.cuentaPagoId = undefined;
    this.montoPago = undefined;
  }

  abrirDialogRetiro() {
    this.displayDialogRetiro = true;
    this.selectedCuentaOrigenId = undefined;
    this.montoMovimiento = undefined;
    this.selectedCajaId = undefined;
  }

  abrirDialogDeposito() {
    this.displayDialogDeposito = true;
    this.selectedCuentaDestinoId = undefined;
    this.montoMovimiento = undefined;
    this.selectedCajaId = undefined;

  }

  abrirDialogTransferencia() {
    this.displayDialogTransferencia = true;
    this.selectedCuentaOrigenId = undefined;
    this.selectedCuentaDestinoId = undefined;
    this.montoMovimiento = undefined;
  }

  registrarRetiro() {
    if (!this.selectedCuentaOrigenId || !this.selectedCajaId || !this.montoMovimiento) return;

    const url = `${this.movimientoService['apiUrl']}/retiro?cuentaId=${this.selectedCuentaOrigenId}&cajaId=${this.selectedCajaId}&monto=${this.montoMovimiento}`;
    this.movimientoService['http'].post(url, {}).subscribe({
      next: () => {
        this.displayDialogRetiro = false;
        this.loadCuentas();
      },
      error: () => alert('Error al registrar retiro')
    });
  }

  registrarDeposito() {
    if (!this.selectedCuentaDestinoId || !this.selectedCajaId || !this.montoMovimiento) return;

    const url = `${this.movimientoService['apiUrl']}/deposito?cuentaId=${this.selectedCuentaDestinoId}&cajaId=${this.selectedCajaId}&monto=${this.montoMovimiento}`;
    this.movimientoService['http'].post(url, {}).subscribe({
      next: () => {
        this.displayDialogDeposito = false;
        this.loadCuentas();
      },
      error: () => alert('Error al registrar depósito')
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

  registrarPagoCliente() {
    if (!this.selectedClienteId || !this.cuentaPagoId || !this.montoPago) return;
    const url = `${this.movimientoService['apiUrl']}/pago?cuentaId=${this.cuentaPagoId}&clienteId=${this.selectedClienteId}&monto=${this.montoPago}`;
    this.movimientoService['http'].post(url, {}).subscribe({
      next: () => {
        this.displayDialogPago = false;
        this.loadCuentas();
        this.loadClientes();
      },
      error: () => alert('Error al registrar pago')
    });
  }

  toggleFlip(account: AccountCop, event: MouseEvent) {
    event.stopPropagation();          // para que no dispare otras cosas
    account.isFlipped = !account.isFlipped;
  }

}