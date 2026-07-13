import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Caja, CajaService } from '../../../../core/services/caja.service';
import { MovimientoService, MovimientoAjusteDto } from '../../../../core/services/movimiento.service';
import { SaldosSseService } from '../../../../core/services/saldos-sse.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { AjusteSaldoDialogComponent } from '../../../../shared/ajustes-saldo/ajuste-saldo-dialog.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { GastoService } from '../../../../core/services/gasto.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SupplierService, Supplier } from '../../../../core/services/supplier.service';
import { ClienteService } from '../../../../core/services/cliente.service';

@Component({
  selector: 'app-cajas-tab',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, InputTextModule, DialogModule, TabViewModule,
    TableModule, CurrencyPipe, CardModule, InputNumberModule, CommonModule,
    ProgressSpinnerModule, TooltipModule, DropdownModule,
    AjusteSaldoDialogComponent
  ],
  templateUrl: './cajas.component.html',
  styleUrls: ['./cajas.component.css']   // 👈 corregido (plural)
})
export class CajasComponent implements OnInit, OnDestroy {

  cajas: Caja[] = [];
  private saldosSub?: Subscription;
  /** Poll rápido de respaldo: mantiene el saldo de las cajas al día aunque el SSE se caiga. */
  private saldosPollTimer?: ReturnType<typeof setInterval>;
  private readonly SALDOS_POLL_MS = 5000;
  displayCajaDialog = false;
  nuevaCaja: Partial<Caja> = { name: '', saldo: 0 };
  showAjusteCaja = false;
  cajaAjuste: Caja | null = null;

  // 🔹 NUEVO: estado para ver movimientos de una caja
  showMovsDialog = false;
  cajaSeleccionada: Caja | null = null;
  movimientosCaja: any[] = [];
  loadingMovs = false;

  ajustesCaja: MovimientoAjusteDto[] = [];
  loadingAjustesCaja = false;

  // Pago de proveedor A CAJA (el proveedor nos da efectivo → entra a una caja)
  showProvACaja = false;
  proveedores: Supplier[] = [];
  provACajaProvId: number | null = null;
  provACajaCajaId: number | null = null;
  provACajaMonto = 0;
  guardandoProvACaja = false;

  // Pago de cliente A CAJA (el cliente nos da efectivo → entra a una caja)
  showCliACaja = false;
  clientes: any[] = [];
  cliACajaClienteId: number | null = null;
  cliACajaCajaId: number | null = null;
  cliACajaMonto = 0;
  guardandoCliACaja = false;

  constructor(
    private movimientoService: MovimientoService,
    private cajaService: CajaService,
    private gastoService: GastoService
  ,
    private notificationService: NotificationService,
    private supplierService: SupplierService,
    private clienteService: ClienteService,
    private saldosSse: SaldosSseService
) { }

  ngOnInit(): void {
    this.loadCajas();

    // Tiempo real: si CUALQUIER movimiento cambia un saldo (p.ej. un retiro de cuenta COP a
    // una caja hecho en otra vista), el backend avisa por SSE y refrescamos las cajas al instante.
    this.saldosSse.connect();
    this.saldosSub = this.saldosSse.cambioSaldos$
      .pipe(debounceTime(500))
      .subscribe(() => this.refrescarSaldosCajas());

    // Respaldo garantizado: aunque el SSE se caiga en Railway, refrescamos el saldo de las cajas
    // por HTTP cada 5s (endpoint liviano), para que nunca haya que darle refresh a mano.
    this.saldosPollTimer = setInterval(() => this.refrescarSaldosCajas(), this.SALDOS_POLL_MS);
  }

  ngOnDestroy(): void {
    this.saldosSub?.unsubscribe();
    clearInterval(this.saldosPollTimer);
  }

  /**
   * Refresco liviano del saldo de las cajas. Actualiza solo el saldo (y el saldo inicial del día)
   * de las cajas que ya están en pantalla, SIN volver a disparar el conteo de gastos por caja.
   * Si aparece/desaparece una caja, hace una recarga completa.
   */
  private refrescarSaldosCajas(): void {
    this.cajaService.listar().subscribe({
      next: data => {
        const idsActuales = new Set(this.cajas.map(c => c.id));
        const cambioDeCajas =
          data.length !== this.cajas.length || data.some(c => !idsActuales.has(c.id));
        if (cambioDeCajas) {
          this.loadCajas();
          return;
        }
        const map = new Map(data.map(c => [c.id, c]));
        this.cajas.forEach(c => {
          const fresh = map.get(c.id);
          if (fresh) {
            c.saldo = fresh.saldo;
            if (fresh.saldoInicialDelDia != null) c.saldoInicialDelDia = fresh.saldoInicialDelDia;
          }
        });
      },
      error: () => { /* silencioso */ }
    });
  }

  /** Abre el diálogo "un proveedor nos da efectivo a una caja". */
  abrirProvACaja(): void {
    this.provACajaProvId = null;
    this.provACajaCajaId = null;
    this.provACajaMonto = 0;
    this.showProvACaja = true;
    // Cargar proveedores para el dropdown (una sola vez).
    if (this.proveedores.length === 0) {
      this.supplierService.getAllSuppliers().subscribe({
        next: provs => this.proveedores = provs || [],
        error: () => this.notificationService.error('No se pudieron cargar los proveedores')
      });
    }
  }

  registrarProvACaja(): void {
    const provId = Number(this.provACajaProvId ?? 0);
    const cajaId = Number(this.provACajaCajaId ?? 0);
    const monto = Number(this.provACajaMonto ?? 0);
    if (!provId || !cajaId || monto <= 0) {
      this.notificationService.error('Selecciona proveedor, caja y un monto válido.');
      return;
    }
    this.guardandoProvACaja = true;
    this.movimientoService.prestamoProveedorACaja(provId, cajaId, monto).subscribe({
      next: () => {
        this.guardandoProvACaja = false;
        this.showProvACaja = false;
        this.notificationService.success('Préstamo de proveedor registrado en la caja.');
        this.loadCajas();
      },
      error: () => {
        this.guardandoProvACaja = false;
        this.notificationService.error('No se pudo registrar la entrada.');
      }
    });
  }

  /** Abre el diálogo "un cliente nos da efectivo a una caja". */
  abrirCliACaja(): void {
    this.cliACajaClienteId = null;
    this.cliACajaCajaId = null;
    this.cliACajaMonto = 0;
    this.showCliACaja = true;
    if (this.clientes.length === 0) {
      this.clienteService.listar().subscribe({
        next: cli => this.clientes = cli || [],
        error: () => this.notificationService.error('No se pudieron cargar los clientes')
      });
    }
  }

  registrarCliACaja(): void {
    const cliId = Number(this.cliACajaClienteId ?? 0);
    const cajaId = Number(this.cliACajaCajaId ?? 0);
    const monto = Number(this.cliACajaMonto ?? 0);
    if (!cliId || !cajaId || monto <= 0) {
      this.notificationService.error('Selecciona cliente, caja y un monto válido.');
      return;
    }
    this.guardandoCliACaja = true;
    this.movimientoService.prestamoClienteACaja(cliId, cajaId, monto).subscribe({
      next: () => {
        this.guardandoCliACaja = false;
        this.showCliACaja = false;
        this.notificationService.success('Préstamo de cliente registrado en la caja.');
        this.loadCajas();
      },
      error: () => {
        this.guardandoCliACaja = false;
        this.notificationService.error('No se pudo registrar la entrada.');
      }
    });
  }

  loadCajas() {
    this.cajaService.listar().subscribe(data => {
      this.cajas = data;

      this.cajas.forEach(caja => {
        if (!caja.id) return;

        this.gastoService.getTotalGastosHoyCaja(caja.id).subscribe(total => {
          caja.gastosHoy = total;
        });
      });
    });
  }


  get totalCajas(): number {
    return this.cajas.reduce((acc, caja) => acc + (caja.saldo ?? 0), 0);
  }

  guardarCaja() {
    if (!this.nuevaCaja.name || this.nuevaCaja.saldo === undefined) return;

    this.cajaService.crear(this.nuevaCaja).subscribe({
      next: caja => {
        this.cajas.push(caja);
        this.displayCajaDialog = false;
        this.nuevaCaja = { name: '', saldo: 0 };
      },
      error: () => this.notificationService.error('Error al guardar caja')
    });
  }

  abrirAjusteCaja(caja: Caja) {
    this.cajaAjuste = caja;
    this.showAjusteCaja = true;
  }

  // ── Eliminar caja ──────────────────────────────────────────────
  eliminarCaja(caja: Caja, event: Event) {
    event.stopPropagation(); // que no abra el modal de movimientos
    if (!caja?.id) return;
    if (!confirm(`¿Eliminar la caja "${caja.name}"? No se puede si tiene movimientos o gastos asociados.`)) return;
    this.cajaService.eliminar(caja.id).subscribe({
      next: () => {
        this.cajas = this.cajas.filter(c => c.id !== caja.id);
        this.notificationService.success('Caja eliminada');
      },
      error: (err) => this.notificationService.error(err?.error?.error || 'No se pudo eliminar la caja.')
    });
  }

  // ── Eliminar un movimiento de la caja (con reversa de saldos/cupo) ──
  /** Solo mostramos el botón para los tipos que el backend sabe revertir. */
  esEliminable(mov: any): boolean {
    const t = (mov?.tipo || '').toUpperCase();
    return t.startsWith('RETIRO') || t === 'PAGO PROVEEDOR' || t === 'TRANSFERENCIA CAJA'
        || t === 'PAGO PROVEEDOR A CAJA' || t === 'PAGO CLIENTE A CAJA'
        || t === 'PRESTAMO PROVEEDOR A CAJA' || t === 'PRESTAMO CLIENTE A CAJA';
  }

  eliminarMovimientoCaja(mov: any) {
    if (!mov?.id) return;
    if (!confirm('¿Eliminar este movimiento? Se revertirán los saldos (y el cupo, si es un retiro de hoy).')) return;
    this.movimientoService.eliminarMovimiento(mov).subscribe({
      next: () => {
        this.movimientosCaja = this.movimientosCaja.filter(m => m.id !== mov.id);
        this.loadCajas(); // los saldos cambiaron con la reversa
        this.notificationService.success('Movimiento eliminado y saldos revertidos');
      },
      error: (err) => this.notificationService.error(err?.error?.error || 'No se pudo eliminar el movimiento.')
    });
  }

  onAjusteCajaRealizado() {
    this.loadCajas(); // refresca saldos después del ajuste
  }

  // 🔹 NUEVO: abrir modal y cargar movimientos por caja
  verMovimientos(caja: Caja) {
    if (!caja?.id) return;
    this.cajaSeleccionada = caja;
    this.movimientosCaja = [];
    this.loadingMovs = true;
    this.showMovsDialog = true;

    this.movimientoService.getMovimientosPorCaja(caja.id).subscribe({
      next: data => {
        // ordenar más reciente primero (por si el backend no lo hace)
        this.movimientosCaja = [...data].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: e => console.error('Error al cargar movimientos de caja', e),
      complete: () => this.loadingMovs = false
    });

    this.movimientoService.getAjustesCaja(caja.id).subscribe({
      next: ajustes => {
        this.ajustesCaja = [...ajustes].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: e => console.error('Error al cargar ajustes de caja', e),
      complete: () => this.loadingAjustesCaja = false
    });
  }
}
