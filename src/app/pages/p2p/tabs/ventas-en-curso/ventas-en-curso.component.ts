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

  /** Mapa de orderNumber → copId seleccionado en el dropdown (antes de guardar) */
  seleccionPendiente: Record<string, number | null> = {};

  private sseSub?: Subscription;

  constructor(
    private syncService: P2PSyncService,
    private accountCopService: AccountCopService,
    private sseService: P2PSseService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCuentasCop();
    this.loadOrdenes();

    // Escuchar SSE — si el backend detecta cambio de estado, recargamos
    this.sseService.connect();
    this.sseSub = this.sseService.cambioOrdenActiva$.subscribe(() => {
      this.loadOrdenes();
    });
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
  }

  // ── Carga de datos ────────────────────────────────────────────

  loadOrdenes(): void {
    this.loading = true;
    this.syncService.getActiveOrders()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => {
          this.ordenes = data;
          // Inicializar selección pendiente con la pre-asignación actual
          for (const o of data) {
            if (!(o.orderNumber in this.seleccionPendiente)) {
              this.seleccionPendiente[o.orderNumber] = o.preAsignadoCopId ?? null;
            }
          }
        },
        error: () => this.notification.error('No se pudo cargar las órdenes activas.')
      });
  }

  loadCuentasCop(): void {
    this.accountCopService.getAll().subscribe({
      next: cuentas => this.cuentasCop = cuentas
    });
  }

  // ── Pre-asignación ────────────────────────────────────────────

  guardarPreAsignacion(orden: ActiveP2POrder): void {
    const copId = this.seleccionPendiente[orden.orderNumber];
    if (!copId) return;

    this.syncService.savePreAsignacion({
      orderNumber:   orden.orderNumber,
      copId,
      accountBinance: orden.accountBinance
    }).subscribe({
      next: () => {
        orden.preAsignadoCopId = copId;
        orden.preAsignadoCopNombre = this.cuentasCop.find(c => c.id === copId)?.name ?? '';
        this.notification.success('Pre-asignación guardada.');
      },
      error: () => this.notification.error('Error al guardar pre-asignación.')
    });
  }

  quitarPreAsignacion(orden: ActiveP2POrder): void {
    this.syncService.deletePreAsignacion(orden.orderNumber).subscribe({
      next: () => {
        orden.preAsignadoCopId = null;
        orden.preAsignadoCopNombre = null;
        this.seleccionPendiente[orden.orderNumber] = null;
        this.notification.success('Pre-asignación removida.');
      },
      error: () => this.notification.error('Error al remover pre-asignación.')
    });
  }

  // ── Helpers de UI ─────────────────────────────────────────────

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
    this.seleccionPendiente[orden.orderNumber] = copId;
  }
}
