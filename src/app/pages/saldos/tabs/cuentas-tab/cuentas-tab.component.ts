import { Component, OnInit } from '@angular/core';
import { AccountCopService, AccountCop, AccountCopCreate, BrebeKey } from '../../../../core/services/account-cop.service';
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
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
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
    ConfirmDialogModule,
    ToastModule,
    AjusteSaldoDialogComponent
  ],
  templateUrl: './cuentas-tab.component.html',
  styleUrls: ['./cuentas-tab.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class CuentasTabComponent implements OnInit {
  cuentas: AccountCop[] = [];
  newAccount: any = { name: '', balance: 0, bankType: null, numeroCuenta: '', cedula: '' };
  displayDialog: boolean = false;

  // ── Flags anti doble-submit ──
  submittingCreate     = false;
  submittingRetiro     = false;
  submittingDeposito   = false;
  submittingTransfer   = false;
  submittingPago       = false;
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
  tipoRetiro: 'CAJERO' | 'CORRESPONSAL' = 'CAJERO';
  tiposRetiro = [
    { label: 'Cajero (ATM)', value: 'CAJERO' },
    { label: 'Corresponsal', value: 'CORRESPONSAL' }
  ];
  displayDialogDeposito: boolean = false;
  displayDialogTransferencia: boolean = false;
  selectedClienteId?: number;

  displayDialogPago: boolean = false;  // <-- faltaba declarar esto
  cuentaPagoId?: number;               // <-- también esta
  montoPago?: number;
  showAjusteCuenta = false;
  cuentaAjuste: AccountCop | null = null;

  // ── Llaves Brebe ──
  showBrebeDialog = false;
  cuentaBrebeActual: AccountCop | null = null;
  nuevaLlave = '';
  nuevaLlaveDesc = '';
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
    private confirmationService: ConfirmationService,
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
    if (this.submittingCreate) return;
    if (!this.newAccount.name?.trim() || this.newAccount.balance == null || !this.newAccount.bankType) {
      this.notificationService.warn('Nombre, balance y tipo de banco son obligatorios');
      return;
    }
    this.submittingCreate = true;
    this.accountService.create(this.newAccount).subscribe({
      next: account => {
        this.cuentas.push(account);
        this.displayDialog = false;
        this.newAccount = { name: '', balance: 0, bankType: null, numeroCuenta: '', cedula: '' };
        this.submittingCreate = false;
      },
      error: () => {
        this.notificationService.error('Error al crear la cuenta');
        this.submittingCreate = false;
      }
    });
  }

  showCreateDialog() {
    this.newAccount = { name: '', balance: 0, bankType: null, numeroCuenta: '', cedula: '' };
    this.displayDialog = true;
  }

  eliminarCuenta(account: AccountCop, event: Event) {
    event.stopPropagation();
    if (!account.id) return;
    this.confirmationService.confirm({
      message: `¿Eliminar la cuenta <strong>${account.name}</strong>? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.accountService.delete(account.id!).subscribe({
          next: () => {
            this.cuentas = this.cuentas.filter(c => c.id !== account.id);
            this.notificationService.success(`Cuenta ${account.name} eliminada`);
          },
          error: () => this.notificationService.error('No se pudo eliminar la cuenta')
        });
      }
    });
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
    this.tipoRetiro = 'CAJERO';
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
    if (this.submittingRetiro) return;
    if (!this.selectedCuentaOrigenId || !this.selectedCajaId || !this.montoMovimiento) return;
    this.submittingRetiro = true;
    this.movimientoService.registrarRetiro(
      this.selectedCuentaOrigenId,
      this.selectedCajaId,
      this.montoMovimiento,
      this.tipoRetiro
    ).subscribe({
      next: () => {
        this.displayDialogRetiro = false;
        this.loadCuentas();
        this.submittingRetiro = false;
        this.notificationService.success('Retiro registrado correctamente.');
      },
      error: (err) => {
        const msg = err?.error?.error ?? 'Error al registrar retiro';
        this.notificationService.error(msg);
        this.submittingRetiro = false;
      }
    });
  }

  registrarDeposito() {
    if (this.submittingDeposito) return;
    if (!this.selectedCuentaDestinoId || !this.selectedCajaId || !this.montoMovimiento) return;
    this.submittingDeposito = true;
    const url = `${this.movimientoService['apiUrl']}/deposito?cuentaId=${this.selectedCuentaDestinoId}&cajaId=${this.selectedCajaId}&monto=${this.montoMovimiento}`;
    this.movimientoService['http'].post(url, {}).subscribe({
      next: () => { this.displayDialogDeposito = false; this.loadCuentas(); this.submittingDeposito = false; },
      error: () => { this.notificationService.error('Error al registrar depósito'); this.submittingDeposito = false; }
    });
  }

  registrarTransferencia() {
    if (this.submittingTransfer) return;
    if (!this.selectedCuentaOrigenId || !this.selectedCuentaDestinoId || !this.montoMovimiento) return;
    this.submittingTransfer = true;
    this.movimientoService.registrarTransferencia(
      this.selectedCuentaOrigenId, this.selectedCuentaDestinoId, this.montoMovimiento
    ).subscribe({
      next: () => { this.displayDialogTransferencia = false; this.loadCuentas(); this.submittingTransfer = false; },
      error: () => { this.notificationService.error('Error al registrar transferencia'); this.submittingTransfer = false; }
    });
  }

  registrarPagoCliente() {
    if (this.submittingPago) return;
    if (!this.selectedClienteId || !this.cuentaPagoId || !this.montoPago) return;
    this.submittingPago = true;
    const url = `${this.movimientoService['apiUrl']}/pago?cuentaId=${this.cuentaPagoId}&clienteId=${this.selectedClienteId}&monto=${this.montoPago}`;
    this.movimientoService['http'].post(url, {}).subscribe({
      next: () => { this.displayDialogPago = false; this.loadCuentas(); this.loadClientes(); this.submittingPago = false; },
      error: () => { this.notificationService.error('Error al registrar pago'); this.submittingPago = false; }
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
      a.download = `cuenta_cop_${accountId}_reporte.xlsx`;
      a.click();

      window.URL.revokeObjectURL(url);
    },
    error: (err) => {
      console.error('Error descargando Excel:', err);
      this.notificationService.error('No se pudo descargar el Excel.');
    }
  });
}

  // ══════════════════════════════════════════
  // LLAVES BREBE
  // ══════════════════════════════════════════

  abrirBrebeDialog(cuenta: AccountCop, event: Event) {
    event.stopPropagation();
    this.cuentaBrebeActual = cuenta;
    this.nuevaLlave = '';
    this.nuevaLlaveDesc = '';
    this.showBrebeDialog = true;
  }

  agregarLlave() {
    if (!this.cuentaBrebeActual?.id || !this.nuevaLlave.trim()) return;
    const llave = this.nuevaLlave.trim();
    const desc = this.nuevaLlaveDesc.trim() || undefined;
    this.accountService.addBrebeKey(this.cuentaBrebeActual.id, llave, desc).subscribe({
      next: key => {
        if (!this.cuentaBrebeActual!.brebeKeys) this.cuentaBrebeActual!.brebeKeys = [];
        this.cuentaBrebeActual!.brebeKeys.push(key);
        this.nuevaLlave = '';
        this.nuevaLlaveDesc = '';
        this.notificationService.success('Llave agregada correctamente.');
      },
      error: () => this.notificationService.error('Error al agregar llave Brebe.')
    });
  }

  eliminarLlave(key: BrebeKey) {
    if (!this.cuentaBrebeActual?.id || !key.id) return;
    this.accountService.deleteBrebeKey(this.cuentaBrebeActual.id, key.id).subscribe({
      next: () => {
        this.cuentaBrebeActual!.brebeKeys =
          this.cuentaBrebeActual!.brebeKeys?.filter(k => k.id !== key.id);
        this.notificationService.success('Llave eliminada.');
      },
      error: () => this.notificationService.error('Error al eliminar llave Brebe.')
    });
  }

  private buildAccountClipboardText(account: AccountCop): string {
    const lines = [
      `${account.name ?? ''}`,
      `${account.bankType ?? ''}`,
      `Cuenta: ${account.numeroCuenta ?? ''}`,
      `Cédula: ${account.cedula ?? ''}`
    ];
    if (account.brebeKeys && account.brebeKeys.length > 0) {
      lines.push('');
      lines.push('Llaves Brebe:');
      for (const k of account.brebeKeys) {
        const desc = k.descripcion ? ` (${k.descripcion})` : '';
        lines.push(`• ${k.llave}${desc}`);
      }
    }
    return lines.join('\n');
  }

}