import { Component, OnInit } from '@angular/core';
import { AccountCopService, AccountCop, AccountCopCreate } from '../../../../core/services/account-cop.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
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
import { MessageService } from 'primeng/api';
import { NotificationService } from '../../../../core/services/notification.service';
type BankType = 'NEQUI' | 'DAVIPLATA' | 'BANCOLOMBIA';

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
    TooltipModule,
    AjusteSaldoDialogComponent
  ],
  templateUrl: './cuentas-tab.component.html',
  styleUrls: ['./cuentas-tab.component.css']
})
export class CuentasTabComponent implements OnInit {
  cuentas: AccountCop[] = [];
  newAccount: AccountCopCreate = {
    name: '', balance: 0, bankType: 'NEQUI', numeroCuenta: '',
    cedula: ''
  };
  displayDialog: boolean = false;
  clientes: Cliente[] = [];
  cajas: Caja[] = [];
  selectedCajaId?: number;
  showCupoDialog = false;

  cupoNequi = 0;
  cupoBancolombia = 0;
  cupoDaviplata = 0;
  cupoTotal = 0;
  bankTypes = [
    { label: 'Nequi', value: 'NEQUI' },
    { label: 'Daviplata', value: 'DAVIPLATA' },
    { label: 'Bancolombia', value: 'BANCOLOMBIA' }
  ];


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
  // NUEVO: total por banco (sum(balance))
  totalNequi = 0;
  totalBancolombia = 0;
  totalDaviplata = 0;
  totalPorBancos = 0;

  // NUEVO: "se puede depositar" (bruto antes del 4x1000)
  depositableNequi = 0;
  depositableBancolombia = 0;
  depositableDaviplata = 0;
  depositableTotal = 0;


  constructor(private accountService: AccountCopService,
    private movimientoService: MovimientoService,
    private clienteService: ClienteService,
    private cajaService: CajaService,
    private gastoService: GastoService,
    private messageService: MessageService,
    private router: Router,
    private notificationService: NotificationService
) { }

  ngOnInit(): void {
    this.loadCuentas();
    this.loadClientes();
    this.cajaService.listar().subscribe({
      next: data => this.cajas = data,
      error: () => this.notificationService.error('Error al cargar cajas')
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
            c.entradasHoy = res.entradasHoy;
            c.salidasHoy = res.salidasHoy;
            c.ajustesHoy = res.ajustesHoy;
            c.ventasDolaresHoy = res.ventasDolaresHoy;
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
      error: () => this.notificationService.error('Error al cargar clientes')
    });
  }

  createAccount() {
    if (!this.newAccount.name || this.newAccount.balance == null || !this.newAccount.bankType) {
      this.notificationService.warn('Nombre, balance y tipo de banco son obligatorios');
      return;
    }

    this.accountService.create(this.newAccount).subscribe(account => {
      this.cuentas.push(account);
      this.displayDialog = false;
      this.newAccount = {
        name: '', balance: 0, bankType: 'NEQUI',
        numeroCuenta: '',
        cedula: ''
      };
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
      error: () => this.notificationService.error('Error al registrar retiro')
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
      error: () => this.notificationService.error('Error al registrar depósito')
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
      error: () => this.notificationService.error('Error al registrar pago')
    });
  }

  toggleFlip(account: AccountCop, event: MouseEvent) {
    event.stopPropagation();
    account.isFlipped = !account.isFlipped;
  }

  toggleP2P(account: AccountCop, event: MouseEvent) {
    event.stopPropagation();
    if (!account.id) return;
    this.accountService.toggleActivaParaP2P(account.id).subscribe({
      next: updated => {
        account.activaParaP2P = updated.activaParaP2P;
        const msg = updated.activaParaP2P
          ? `${account.name} marcada como activa para P2P`
          : `${account.name} removida de P2P activas`;
        this.notificationService.success(msg);
      },
      error: () => this.notificationService.error('Error al actualizar cuenta')
    });
  }
  getDisponible(balance?: number | null): number {
    const b = Number(balance ?? 0);
    const comision = b * 0.004; // 4x1000
    return b - comision;
  }

  selectedBankType: 'NEQUI' | 'DAVIPLATA' | 'BANCOLOMBIA' | null = null;

  setBankFilter(type: 'NEQUI' | 'DAVIPLATA' | 'BANCOLOMBIA' | null) {
    this.selectedBankType = type;
  }

  get filteredCuentas(): AccountCop[] {
    const base = !this.selectedBankType
      ? this.cuentas
      : this.cuentas.filter(c => c.bankType === this.selectedBankType);

    // ordenar de mayor a menor balance
    return [...base].sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0));
  }

  bankLogo(type?: string | null): string {
    const t = (type ?? '').toString().trim().toUpperCase();

    switch (t as BankType) {
      case 'NEQUI': return '/assets/layout/images/nequi.png';
      case 'DAVIPLATA': return '/assets/layout/images/daviplata.png';
      case 'BANCOLOMBIA': return '/assets/layout/images/bancolombia.png';
      default: return '/assets/layout/images/nequi.png';
    }
  }

  openCupoDialog(): void {
    const list = this.filteredCuentas ?? this.cuentas ?? [];

    // 1) Cupo disponible por banco (ya lo hacías)
    this.cupoNequi = this.sumCupoByBank(list, 'NEQUI');
    this.cupoBancolombia = this.sumCupoByBank(list, 'BANCOLOMBIA');
    this.cupoDaviplata = this.sumCupoByBank(list, 'DAVIPLATA');
    this.cupoTotal = this.cupoNequi + this.cupoBancolombia + this.cupoDaviplata;

    // 2) Total por banco (sum balance)
    this.totalNequi = this.sumBalanceByBank(list, 'NEQUI');
    this.totalBancolombia = this.sumBalanceByBank(list, 'BANCOLOMBIA');
    this.totalDaviplata = this.sumBalanceByBank(list, 'DAVIPLATA');
    this.totalPorBancos = this.totalNequi + this.totalBancolombia + this.totalDaviplata;

    // 3) “Se puede depositar” (bruto para que al descontar 4x1000 quede el disponible)
    this.depositableNequi = this.getDepositableFromNet(this.cupoNequi);
    this.depositableBancolombia = this.getDepositableFromNet(this.cupoBancolombia);
    this.depositableDaviplata = this.getDepositableFromNet(this.cupoDaviplata);
    this.depositableTotal = this.depositableNequi + this.depositableBancolombia + this.depositableDaviplata;

    this.showCupoDialog = true;
  }

  private sumCupoByBank(list: any[], bankType: 'NEQUI' | 'BANCOLOMBIA' | 'DAVIPLATA'): number {
    return list
      .filter(a => (a.bankType || '').toUpperCase() === bankType)
      .reduce((acc, a) => acc + (Number(a.cupoDisponibleHoy) || 0), 0);
  }
  private formatCop(n: any): string {
    const value = Number(n ?? 0);
    return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
  private sumBalanceByBank(list: any[], bankType: 'NEQUI' | 'BANCOLOMBIA' | 'DAVIPLATA'): number {
    return list
      .filter(a => (a.bankType || '').toUpperCase() === bankType)
      .reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  }
  private getDepositableFromNet(net: number): number {
    const n = Number(net) || 0;
    return n <= 0 ? 0 : (n / 0.996);
  }

  private buildAccountClipboardText(account: AccountCop): string {
    // arma el texto como tu cliente lo quiere
    // puedes cambiar el formato libremente
    const lines = [
      `${account.name ?? ''}`,
      `${account.bankType ?? ''}`,
      `Cuenta: ${account.numeroCuenta ?? ''}`,
      `Cédula: ${account.cedula ?? ''}`
    ];

    return lines.join('\n');
  }

  async copiarCuenta(account: AccountCop, event?: Event) {
    event?.stopPropagation(); // evita flip / clicks raros

    const text = this.buildAccountClipboardText(account);

    try {
      // ✅ método moderno
      await navigator.clipboard.writeText(text);

      this.messageService.add({
        severity: 'success',
        summary: 'Copiado',
        detail: 'La información de la cuenta quedó en el portapapeles.'
      });
    } catch (err) {
      // ✅ fallback por si el navegador bloquea clipboard
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        this.messageService.add({
          severity: 'success',
          summary: 'Copiado',
          detail: 'La información de la cuenta quedó en el portapapeles.'
        });
      } catch (e) {
        console.error('No se pudo copiar:', e);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo copiar al portapapeles.'
        });
      }
    }
  }
  downloadExcelAccountCop(accountId: number) {
  if (!accountId) return;

  this.accountService.downloadExcel(accountId).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `cuenta_cop_${accountId}_reporte.xlsx`; // nombre opcional
      a.click();

      window.URL.revokeObjectURL(url);
    },
    error: (err) => {
      console.error('Error descargando Excel:', err);
      this.notificationService.error('No se pudo descargar el Excel.');
    }
  });
}


}