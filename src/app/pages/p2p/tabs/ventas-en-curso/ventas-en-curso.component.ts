import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { P2PSyncService, ActiveP2POrder } from '../../../../core/services/p2p-sync.service';
import { AccountCopService, AccountCop } from '../../../../core/services/account-cop.service';
import { P2PSseService } from '../../../../core/services/p2p-sse.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AnunciosService, AnuncioDto } from '../../../../core/services/anuncios.service';

@Component({
  selector: 'app-ventas-en-curso',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    TagModule, DropdownModule, TooltipModule, ProgressSpinnerModule
  ],
  templateUrl: './ventas-en-curso.component.html',
  styleUrls: ['./ventas-en-curso.component.css']
})
export class VentasEnCursoComponent implements OnInit, OnDestroy {

  ordenes: ActiveP2POrder[] = [];
  cuentasCop: AccountCop[]  = [];
  loading = false;
  /** Refresco en segundo plano (no vacía la tabla, solo marca el botón). */
  refreshing = false;

  anuncios: AnuncioDto[] = [];
  loadingAnuncios = false;
  ultimaActualizacionAnuncios: string | null = null;

  /** Mapa de orderNumber → copId seleccionado en el dropdown (antes de guardar) */
  seleccionPendiente: Record<string, number | null> = {};

  /** Última cuenta COP asignada — para el botón "=" (repetir la misma asignación). */
  ultimaCopId: number | null = null;
  ultimaCopNombre = '';

  /** Contador regresivo para el próximo auto-refresh */
  countdown = 15;
  private readonly REFRESH_INTERVAL = 15;

  sseConectado = false;

  private sseSub?: Subscription;
  private sseStatusSub?: Subscription;
  private p2pSub?: Subscription;
  private countdownTimer?: ReturnType<typeof setInterval>;

  constructor(
    private syncService: P2PSyncService,
    private accountCopService: AccountCopService,
    private sseService: P2PSseService,
    private notification: NotificationService,
    private anunciosService: AnunciosService
  ) {}

  ngOnInit(): void {
    this.loadCuentasCop();
    this.loadOrdenes();
    this.loadAnuncios();
    this.startCountdown();

    // Escuchar SSE — si el backend detecta cambio de estado, recargamos
    this.sseService.connect();
    this.sseSub = this.sseService.cambioOrdenActiva$.subscribe(() => {
      this.loadOrdenes();
      this.resetCountdown();
    });
    this.sseStatusSub = this.sseService.connected$.subscribe(v => this.sseConectado = v);

    // Si otra vista (el modal) cambia el estado P2P de una cuenta, recargamos
    this.p2pSub = this.accountCopService.p2pCambio$.subscribe(() => this.loadCuentasCop());
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
    this.sseStatusSub?.unsubscribe();
    this.p2pSub?.unsubscribe();
    clearInterval(this.countdownTimer);
  }

  // ── Countdown ────────────────────────────────────────────────

  private startCountdown(): void {
    this.countdown = this.REFRESH_INTERVAL;
    this.countdownTimer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.loadOrdenes();
        this.countdown = this.REFRESH_INTERVAL;
      }
    }, 1000);
  }

  resetCountdown(): void {
    this.countdown = this.REFRESH_INTERVAL;
  }

  // ── Carga de datos ────────────────────────────────────────────

  loadOrdenes(): void {
    // Solo mostramos el spinner grande en la PRIMERA carga (tabla vacía).
    // En los refrescos de 15s hacemos un refresco silencioso: la tabla vieja
    // se mantiene visible hasta que llegan los datos nuevos (sin parpadeo en blanco).
    if (this.ordenes.length === 0) this.loading = true;
    this.refreshing = true;
    this.syncService.getActiveOrders()
      .pipe(finalize(() => { this.loading = false; this.refreshing = false; }))
      .subscribe({
        next: data => {
          this.ordenes = data;
          // Sincronizar seleccionPendiente:
          // Si el servidor tiene un valor definido → es la fuente de verdad (override).
          // Si el servidor no tiene pre-asignación y el cliente ya tiene una selección
          // pendiente → conservar la selección del cliente (acaba de guardar).
          const nuevo: Record<string, number | null> = { ...this.seleccionPendiente };
          for (const o of data) {
            if (o.preAsignadoCopId != null) {
              // Servidor manda un valor real → confiar en él
              nuevo[o.orderNumber] = o.preAsignadoCopId;
            } else if (!(o.orderNumber in nuevo)) {
              // Clave nueva sin valor en servidor → inicializar a null
              nuevo[o.orderNumber] = null;
            }
            // Si clave ya existe y servidor devuelve null → mantener selección cliente
          }
          this.seleccionPendiente = nuevo; // nuevo objeto → Angular detecta cambio
        },
        error: () => this.notification.error('No se pudo cargar las órdenes activas.')
      });
  }

  loadCuentasCop(): void {
    this.accountCopService.getAll().subscribe({
      next: cuentas => this.cuentasCop = cuentas
    });
  }

  loadAnuncios(): void {
    this.loadingAnuncios = true;
    this.anunciosService.getMisAnuncios()
      .pipe(finalize(() => this.loadingAnuncios = false))
      .subscribe({
        next: data => {
          this.anuncios = data;
          this.ultimaActualizacionAnuncios = new Intl.DateTimeFormat('es-CO', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
          }).format(new Date());
        },
        error: () => { this.anuncios = []; }
      });
  }

  // ── Pre-asignación ────────────────────────────────────────────

  guardarPreAsignacion(orden: ActiveP2POrder): void {
    const orderNumber = orden.orderNumber;
    const copId = this.seleccionPendiente[orderNumber];
    if (!copId) return;

    this.syncService.savePreAsignacion({
      orderNumber,
      copId,
      accountBinance: orden.accountBinance
    }).subscribe({
      next: () => {
        // Buscar la referencia VIVA en this.ordenes (no la closure que puede ser stale)
        const live = this.ordenes.find(o => o.orderNumber === orderNumber);
        const target = live ?? orden;
        target.preAsignadoCopId = copId;
        target.preAsignadoCopNombre = this.cuentasCop.find(c => c.id === copId)?.name ?? '';
        // Nuevo objeto para forzar CD
        this.seleccionPendiente = { ...this.seleccionPendiente, [orderNumber]: copId };
        this.notification.success('Pre-asignación guardada.');
      },
      error: () => this.notification.error('Error al guardar pre-asignación.')
    });
  }

  quitarPreAsignacion(orden: ActiveP2POrder): void {
    const orderNumber = orden.orderNumber;
    this.syncService.deletePreAsignacion(orderNumber).subscribe({
      next: () => {
        const live = this.ordenes.find(o => o.orderNumber === orderNumber);
        const target = live ?? orden;
        target.preAsignadoCopId = null;
        target.preAsignadoCopNombre = null;
        this.seleccionPendiente = { ...this.seleccionPendiente, [orderNumber]: null };
        this.notification.success('Pre-asignación removida.');
      },
      error: () => this.notification.error('Error al remover pre-asignación.')
    });
  }

  // ── Helpers de UI — órdenes ───────────────────────────────────

  statusSeverity(status: string): 'warning' | 'info' | 'secondary' {
    switch (status) {
      case 'BUYER_PAYED': return 'warning';
      case 'TRADING':     return 'info';
      default:            return 'secondary';
    }
  }

  statusIcon(status: string): string {
    switch (status) {
      case 'BUYER_PAYED': return 'pi pi-clock';
      case 'TRADING':     return 'pi pi-sync';
      default:            return 'pi pi-circle';
    }
  }

  get cuentasActivasP2P() {
    return this.cuentasCop.filter(c => c.activaParaP2P);
  }

  /** ID de la cuenta que se está quitando de P2P (para el spinner del botón). */
  desactivandoId: number | null = null;

  /** Quita la cuenta de P2P (deselecciona) desde su card. */
  desactivarP2P(c: AccountCop): void {
    if (!c.id || this.desactivandoId === c.id) return;
    this.desactivandoId = c.id;
    this.accountCopService.toggleActivaParaP2P(c.id)
      .pipe(finalize(() => this.desactivandoId = null))
      .subscribe({
        next: updated => {
          c.activaParaP2P = updated.activaParaP2P;
          this.accountCopService.notificarCambioP2P();
          this.notification.success(`${c.name} quitada de P2P`);
        },
        error: () => this.notification.error('No se pudo quitar la cuenta de P2P.')
      });
  }

  bankColor(bank: string): string {
    const m: Record<string, string> = {
      NEQUI: '#7c3aed', BANCOLOMBIA: '#f59e0b', DAVIPLATA: '#ef4444'
    };
    return m[bank] ?? '#6b7280';
  }

  /** Solo muestra las cuentas marcadas como activas para P2P.
   *  Si ninguna está marcada, muestra todas como fallback. */
  copOptions() {
    const activas = this.cuentasCop.filter(c => c.activaParaP2P);
    const lista   = activas.length > 0 ? activas : this.cuentasCop;
    return lista.map(c => ({ label: c.name, value: c.id }));
  }

  get hayActivasP2P(): boolean {
    return this.cuentasCop.some(c => c.activaParaP2P);
  }

  dropdownChanged(orden: ActiveP2POrder, copId: number | null): void {
    // Spread para nuevo objeto → Angular detecta cambio inmediatamente en [ngModel]
    this.seleccionPendiente = { ...this.seleccionPendiente, [orden.orderNumber]: copId };
    if (copId) {
      // Recordar la última cuenta asignada para el botón "=".
      this.ultimaCopId = copId;
      this.ultimaCopNombre = this.cuentasCop.find(c => c.id === copId)?.name ?? '';
      this.guardarPreAsignacion(orden);
    } else if (orden.preAsignadoCopId) {
      this.quitarPreAsignacion(orden);
    }
  }

  /** Botón "=": asigna a esta orden la última cuenta COP usada, sin volver a buscar en el dropdown. */
  asignarUltima(orden: ActiveP2POrder): void {
    if (this.ultimaCopId == null) return;
    this.dropdownChanged(orden, this.ultimaCopId);
  }

  /** Extrae solo la hora de un createTime con formato "YYYY-MM-DD HH:mm:ss" */
  horaCorta(createTime: string): string {
    if (!createTime) return '';
    const partes = createTime.split(' ');
    return partes.length > 1 ? partes[1] : createTime;
  }

  // ── Helpers de UI — anuncios ──────────────────────────────────

  tipoSeverity(tipo: string): 'success' | 'danger' {
    return tipo?.toUpperCase() === 'SELL' ? 'danger' : 'success';
  }

  tipoLabel(tipo: string): string {
    return tipo?.toUpperCase() === 'SELL' ? 'VENTA' : 'COMPRA';
  }

  fmtCop(valor: string): string {
    const n = parseFloat(valor);
    if (isNaN(n)) return valor ?? '—';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n);
  }
}
