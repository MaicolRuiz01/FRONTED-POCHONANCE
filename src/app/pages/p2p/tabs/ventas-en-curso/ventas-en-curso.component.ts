import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { Subscription } from 'rxjs';
import { finalize, debounceTime } from 'rxjs/operators';
import { SaldosSseService } from '../../../../core/services/saldos-sse.service';

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
    TagModule, DropdownModule, TooltipModule, ProgressSpinnerModule, DialogModule
  ],
  templateUrl: './ventas-en-curso.component.html',
  styleUrls: ['./ventas-en-curso.component.css']
})
export class VentasEnCursoComponent implements OnInit, OnDestroy {

  ordenes: ActiveP2POrder[] = [];
  cuentasCop: AccountCop[]  = [];
  /** Cuentas activas para P2P — cacheado (NO getter) para no recalcular en cada ciclo de CD. */
  cuentasActivasP2P: AccountCop[] = [];
  /** Opciones del dropdown de asignación — cacheadas. Solo se reconstruyen cuando cambian
   *  las cuentas o las órdenes, NO en cada ciclo de detección de cambios (que corre cada segundo). */
  copOptionsList: { label: string; value: number }[] = [];

  /** Saldos por cuenta (verde=recibido, amarillo=pendiente, proyectado=verde+amarillo), CACHEADOS.
   *  Se recalculan explícitamente en cada evento (asignar, marcar, refrescar) y en cada tick, para
   *  que el naranja SIEMPRE sume todas las órdenes pre-asignadas y no se quede "pegado" en la 1ª. */
  verdePorCuenta: Record<number, number> = {};
  amarilloPorCuenta: Record<number, number> = {};
  proyectadoPorCuenta: Record<number, number> = {};

  /** NARANJA 100% VISUAL (del lado del cliente). key = orderNumber.
   *  Acumula las ventas que el operador asignó y que siguen EN CURSO. NO depende de ningún campo
   *  del servidor que se pierda en los refrescos. Solo se limpia cuando la orden se COMPLETA
   *  (sale de la lista de en curso → su dinero pasa al saldo real) o el operador la DESASIGNA. */
  private naranjaAsignada: Record<string, { copId: number; pesos: number; recibido: boolean }> = {};
  loading = false;
  /** Refresco en segundo plano (no vacía la tabla, solo marca el botón). */
  refreshing = false;

  anuncios: AnuncioDto[] = [];
  loadingAnuncios = false;
  ultimaActualizacionAnuncios: string | null = null;

  /** Mapa de orderNumber → copId seleccionado en el dropdown (antes de guardar) */
  seleccionPendiente: Record<string, number | null> = {};

  /** Estado manual marcado localmente (RECIBIDO/PENDIENTE) por orderNumber. Evita que el
   *  refresco de 15s pise lo que el usuario acaba de marcar (verde/amarillo). */
  private estadoManualLocal: Record<string, 'RECIBIDO' | 'PENDIENTE'> = {};

  /** Última cuenta COP asignada — para el botón "=" (repetir la misma asignación). */
  ultimaCopId: number | null = null;
  ultimaCopNombre = '';

  /** Cupo máximo del día por banco (en miles, igual que el backend y el modal de cuentas). */
  private readonly cupoMax: Record<string, { cajero: number; corresponsal: number }> = {
    NEQUI:       { cajero: 2700, corresponsal: 5000 },
    BANCOLOMBIA: { cajero: 2700, corresponsal: 10000 },
    DAVIPLATA:   { cajero: 3000, corresponsal: 5000 },
  };

  /** Aviso de cupo lleno (cambiar / desactivar). */
  showCupoLleno = false;
  cupoLlenoCuenta: AccountCop | null = null;
  /** Cuentas ya avisadas (para no repetir el modal en cada refresco). */
  private cupoLlenoAvisado = new Set<number>();

  /** Contador regresivo para el próximo auto-refresh */
  countdown = 15;
  private readonly REFRESH_INTERVAL = 15;

  sseConectado = false;

  private sseSub?: Subscription;
  private sseStatusSub?: Subscription;
  private p2pSub?: Subscription;
  private saldosSub?: Subscription;
  private countdownTimer?: ReturnType<typeof setInterval>;
  /** Polling rápido de saldos: mantiene balance+cupo al día sin depender del SSE (que Railway rompe). */
  private saldosPollTimer?: ReturnType<typeof setInterval>;
  private readonly SALDOS_POLL_MS = 5000;

  constructor(
    private syncService: P2PSyncService,
    private accountCopService: AccountCopService,
    private sseService: P2PSseService,
    private notification: NotificationService,
    private anunciosService: AnunciosService,
    private saldosSse: SaldosSseService
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

    // Tiempo real de saldos COP: al cambiar un saldo, refresca las mini-cards al instante.
    this.saldosSse.connect();
    this.saldosSub = this.saldosSse.cambioSaldos$
      .pipe(debounceTime(700))
      .subscribe(() => this.refrescarSaldosCop());

    // Respaldo garantizado: aunque el SSE se caiga en Railway, refrescamos los saldos por HTTP
    // cada 5s (getSaldos es liviano: id+balance+cupo). Así el saldo/cupo siempre está al día
    // para saber si una cuenta supera su límite, sin tener que darle refresh a mano.
    this.saldosPollTimer = setInterval(() => this.refrescarSaldosCop(), this.SALDOS_POLL_MS);

    // Si otra vista (el modal) cambia el estado P2P de una cuenta, recargamos
    this.p2pSub = this.accountCopService.p2pCambio$.subscribe(() => this.loadCuentasCop());
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
    this.sseStatusSub?.unsubscribe();
    this.p2pSub?.unsubscribe();
    this.saldosSub?.unsubscribe();
    this.saldosSse.disconnect();
    clearInterval(this.countdownTimer);
    clearInterval(this.saldosPollTimer);
  }

  /** Refresco liviano de saldos COP (id + balance + cupos). Se llama por SSE y por el polling
   *  rápido de abajo, para que el saldo y el cupo estén siempre al día sin darle refresh a mano. */
  private refrescarSaldosCop(): void {
    this.accountCopService.getSaldos().subscribe({
      next: saldos => {
        // ¿Apareció una cuenta COP nueva (o se eliminó una)? Entonces la lista liviana no
        // alcanza: recargamos la lista completa para que la cuenta nueva salga sola.
        const idsActuales = new Set(this.cuentasCop.map(c => c.id));
        const hayCambioDeCuentas =
          saldos.length !== this.cuentasCop.length ||
          saldos.some(s => !idsActuales.has(s.id));
        if (hayCambioDeCuentas) {
          this.loadCuentasCop();
          return;
        }

        const map = new Map(saldos.map(s => [s.id, s as any]));
        this.cuentasCop.forEach(c => {
          if (c.id != null && map.has(c.id)) {
            const s = map.get(c.id)!;
            c.balance = s.balance;
            if (s.cupoCajeroDisponibleHoy != null) c.cupoCajeroDisponibleHoy = s.cupoCajeroDisponibleHoy;
            if (s.cupoCorresponsalDisponibleHoy != null) c.cupoCorresponsalDisponibleHoy = s.cupoCorresponsalDisponibleHoy;
          }
        });
        this.recomputarVistaCop();
      },
      error: () => { /* silencioso */ }
    });
  }

  // ── Countdown ────────────────────────────────────────────────

  private startCountdown(): void {
    this.countdown = this.REFRESH_INTERVAL;
    this.countdownTimer = setInterval(() => {
      this.countdown--;
      // Red de seguridad: recalcula los saldos cada segundo desde this.ordenes, así el naranja
      // nunca se queda "pegado" aunque algún evento no haya disparado el recálculo.
      this.recomputarSaldos();
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
          // ── Detectar órdenes marcadas "ya cayó" (RECIBIDO) que YA salieron de la lista de
          //    activas: significa que la venta se completó y el backend ya acreditó su COP en el
          //    saldo real. Para que el VERDE no baje ni un segundo (el monto pasa de "recibido en
          //    curso" a "saldo real"), refrescamos los saldos AL INSTANTE en vez de esperar el
          //    polling de 5s. Sin esto, el amarillo desaparece pero el verde tarda en sumar. ──
          const numerosNuevos = new Set(data.map(o => o.orderNumber));
          const recibidosQueSalieron = Object.keys(this.estadoManualLocal).filter(
            on => this.estadoManualLocal[on] === 'RECIBIDO' && !numerosNuevos.has(on)
          );

          // Conservar el estado manual recién marcado por el usuario (que el refresco no lo pise).
          for (const o of data) {
            const local = this.estadoManualLocal[o.orderNumber];
            if (local) o.estadoManual = local;
          }
          this.ordenes = data;

          if (recibidosQueSalieron.length > 0) {
            // El saldo real ya debería incluir estas ventas → traerlo de una, y de nuevo a los 2s
            // por si el backend aún estaba acreditando cuando la orden salió de Binance.
            this.refrescarSaldosCop();
            setTimeout(() => this.refrescarSaldosCop(), 2000);
            // Limpiar los overrides locales que ya cumplieron su función.
            recibidosQueSalieron.forEach(on => delete this.estadoManualLocal[on]);
          }
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

          // ── Sincronizar el registro VISUAL del naranja (naranjaAsignada) ──────────
          // Regla: los refrescos NUNCA quitan una asignación por el null del servidor.
          //  (1) Se QUITA una venta del naranja solo cuando ya NO está en curso (se completó/canceló):
          //      su dinero pasó al saldo real. (2) Se SIEMBRA desde el servidor lo que ya venía
          //      asignado (para que al abrir la vista se vea lo existente), y se refresca su monto.
          const activos = new Set(this.ordenes.map(o => o.orderNumber));
          for (const on of Object.keys(this.naranjaAsignada)) {
            if (!activos.has(on)) delete this.naranjaAsignada[on]; // se completó → al saldo real
          }
          for (const o of this.ordenes) {
            const ex = this.naranjaAsignada[o.orderNumber];
            if (o.preAsignadoCopId != null) {
              // El servidor confirma una asignación → asegurarla (add si falta, refrescar monto).
              this.naranjaAsignada[o.orderNumber] = {
                copId: o.preAsignadoCopId,
                pesos: o.pesosCop ?? ex?.pesos ?? 0,
                recibido: ex ? ex.recibido : (o.estadoManual === 'RECIBIDO'),
              };
            } else if (ex) {
              // El servidor aún no refleja lo que el cliente asignó → conservar, solo refrescar monto.
              ex.pesos = o.pesosCop ?? ex.pesos;
            }
            // Reflejar la asignación visual en la orden (para la sub-fila y el dropdown).
            const vis = this.naranjaAsignada[o.orderNumber];
            if (vis && o.preAsignadoCopId == null) {
              o.preAsignadoCopId = vis.copId;
              o.preAsignadoCopNombre = this.cuentasCop.find(c => c.id === vis.copId)?.name ?? o.preAsignadoCopNombre;
            }
          }

          // Las órdenes afectan el label "cupo lleno" del dropdown → recomputar opciones.
          this.recomputarVistaCop();
        },
        error: () => this.notification.error('No se pudo cargar las órdenes activas.')
      });
  }

  loadCuentasCop(): void {
    // Endpoint liviano (sin llaves Brebe) → mucho más rápido para pintar las mini-cards y el dropdown.
    this.accountCopService.getP2PView().subscribe({
      next: cuentas => {
        this.cuentasCop = cuentas;
        this.recomputarVistaCop();
      }
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
        if (!target.estadoManual) target.estadoManual = 'PENDIENTE'; // por defecto, amarillo
        // Nuevo objeto para forzar CD
        this.seleccionPendiente = { ...this.seleccionPendiente, [orderNumber]: copId };
        this.recomputarVistaCop();
        this.notification.success('Pre-asignación guardada.');
        // Aviso (NO bloqueo) si con esta asignación el amarillo se pasa del cupo.
        this.avisarSiExcedeCupo(copId);
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
        delete this.naranjaAsignada[orderNumber]; // sale del naranja visual
        this.recomputarVistaCop();
        this.notification.success('Pre-asignación removida.');
      },
      error: () => this.notification.error('Error al remover pre-asignación.')
    });
  }

  // ── Helpers de UI — órdenes ───────────────────────────────────

  statusSeverity(status: string): 'warning' | 'info' | 'secondary' | 'danger' {
    switch (status) {
      case 'BUYER_PAYED': return 'warning';
      case 'TRADING':     return 'info';
      case 'IN_APPEAL':   return 'danger';   // venta apelada / en disputa
      default:            return 'secondary';
    }
  }

  statusIcon(status: string): string {
    switch (status) {
      case 'BUYER_PAYED': return 'pi pi-clock';
      case 'TRADING':     return 'pi pi-sync';
      case 'IN_APPEAL':   return 'pi pi-exclamation-triangle';
      default:            return 'pi pi-circle';
    }
  }

  /** trackBy para que el *ngFor no re-renderice todas las cards/filas en cada refresco. */
  trackByCuenta = (_: number, c: AccountCop) => c.id;
  trackByOrden = (_: number, o: ActiveP2POrder) => o.orderNumber;

  /** Reconstruye lo derivado de cuentasCop + ordenes (activas y opciones del dropdown).
   *  Se llama SOLO cuando esos datos cambian, no en cada ciclo de detección de cambios. */
  private recomputarVistaCop(): void {
    this.cuentasActivasP2P = this.cuentasCop.filter(c => c.activaParaP2P);
    const lista = this.cuentasActivasP2P.length > 0 ? this.cuentasActivasP2P : this.cuentasCop;
    this.copOptionsList = lista.map(c => ({
      label: this.cupoLlenoDe(c) ? `${c.name} — cupo lleno` : c.name,
      value: c.id!
    }));
    // Los saldos verde/amarillo dependen de las órdenes → recalcular junto con la vista.
    this.recomputarSaldos();
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
          if (c.id != null) this.cupoLlenoAvisado.delete(c.id); // permitir re-avisar si se reactiva
          this.recomputarVistaCop();
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

  /** Copia al portapapeles los datos de la cuenta COP: nombre, banco, cédula y número de cuenta. */
  copiarCuenta(c: AccountCop): void {
    const lineas = [
      `Nombre: ${c.name || '—'}`,
      `Banco: ${c.bankType || '—'}`,
      `Cédula: ${c.cedula || '—'}`,
      `Número de cuenta: ${c.numeroCuenta || '—'}`,
    ];
    const texto = lineas.join('\n');
    navigator.clipboard.writeText(texto).then(
      () => this.notification.success(`Datos de ${c.name} copiados.`),
      () => this.notification.error('No se pudieron copiar los datos.')
    );
  }

  /** Solo muestra las cuentas marcadas como activas para P2P.
   *  Si ninguna está marcada, muestra todas como fallback.
   *  Las cuentas con el cupo lleno se marcan en la etiqueta, pero NO se bloquean
   *  (el cliente pidió advertencia, no prohibición). */

  // ── Saldos verde (recibido) / amarillo (pendiente) por cuenta ──

  /** Suma de pesosCop de las órdenes pre-asignadas a la cuenta con (o sin) estado RECIBIDO. */
  private sumaOrdenes(copId: number | null | undefined, recibido: boolean): number {
    if (copId == null) return 0;
    return this.ordenes
      .filter(o => o.preAsignadoCopId === copId && ((o.estadoManual === 'RECIBIDO') === recibido))
      .reduce((s, o) => s + (o.pesosCop ?? 0), 0);
  }

  /** Recalcula los saldos verde/amarillo/proyectado de TODAS las cuentas a partir de this.ordenes.
   *  Se llama en cada evento (asignar, quitar, marcar, refrescar saldos, cargar órdenes) y en el
   *  tick de 1s, así el naranja siempre refleja la suma de TODAS las órdenes pre-asignadas. */
  private recomputarSaldos(): void {
    const verde: Record<number, number> = {};      // saldo real + ventas asignadas YA recibidas
    const amarillo: Record<number, number> = {};   // ventas asignadas pendientes por caer
    const proyectado: Record<number, number> = {}; // saldo real + TODAS las ventas asignadas

    // Arranca cada cuenta en su saldo real (lo que YA tiene la cuenta).
    // Number(...) defensivo: si el backend llega a mandar el balance como string (p.ej. BigDecimal
    // serializado), evita que el "+=" de abajo concatene texto en vez de sumar.
    for (const c of this.cuentasCop) {
      if (c.id == null) continue;
      verde[c.id] = Number(c.balance ?? 0) || 0;
      amarillo[c.id] = 0;
    }

    // Suma las ventas asignadas desde el registro VISUAL del cliente (naranjaAsignada).
    // 100% cliente → los refrescos no lo tocan, así que suma TODAS, no solo la primera.
    // Number(...) defensivo por la misma razón: pesosCop debe sumarse como número siempre,
    // incluso si en algún punto llega como string desde el servidor.
    for (const on of Object.keys(this.naranjaAsignada)) {
      const { copId, pesos, recibido } = this.naranjaAsignada[on];
      const monto = Number(pesos ?? 0) || 0;
      if (verde[copId] == null) { verde[copId] = 0; amarillo[copId] = 0; }
      if (recibido) verde[copId] += monto;
      else amarillo[copId] += monto;
    }

    // Proyectado (naranja) = saldo real + TODAS las ventas asignadas (recibidas + pendientes).
    for (const c of this.cuentasCop) {
      if (c.id == null) continue;
      proyectado[c.id] = (verde[c.id] ?? (c.balance ?? 0)) + (amarillo[c.id] ?? 0);
    }

    // Reasignar (nuevas referencias) para que la vista se actualice sí o sí.
    this.verdePorCuenta = verde;
    this.amarilloPorCuenta = amarillo;
    this.proyectadoPorCuenta = proyectado;
  }

  /** VERDE (solo visual): saldo real + órdenes marcadas como RECIBIDO. */
  saldoVerdeDe(c: AccountCop): number {
    return c.id != null ? (this.verdePorCuenta[c.id] ?? (c.balance ?? 0)) : (c.balance ?? 0);
  }

  /** AMARILLO (monto pendiente por caer) — se usa para el aviso de cupo y el *ngIf. */
  saldoAmarilloDe(c: AccountCop): number {
    return c.id != null ? (this.amarilloPorCuenta[c.id] ?? 0) : 0;
  }

  /** AMARILLO que se MUESTRA: con cuánto quedará la cuenta cuando caiga lo pendiente
   *  = verde (saldo real + recibidas) + lo pendiente por caer. */
  saldoProyectadoDe(c: AccountCop): number {
    return c.id != null ? (this.proyectadoPorCuenta[c.id] ?? this.saldoVerdeDe(c)) : this.saldoVerdeDe(c);
  }

  medioLabel(c: AccountCop): string {
    if (c.cupoTipoP2P === 'CORRESPONSAL') return 'corresponsal';
    if (c.cupoTipoP2P === 'AMBOS') return 'cajero+corresponsal';
    return 'cajero';
  }

  /** Aviso (NO bloqueo) si el amarillo de la cuenta superó su cupo. */
  private avisarSiExcedeCupo(copId: number | null | undefined): void {
    if (copId == null) return;
    const c = this.cuentasCop.find(x => x.id === copId);
    if (!c) return;
    const max = this.cupoMaxDeCuenta(c);
    if (max <= 0) return;
    const amarillo = this.saldoAmarilloDe(c);
    if (amarillo > max) {
      const exceso = amarillo - max;
      this.notification.warn(
        `Ojo: ${c.name} se pasó del cupo de ${this.medioLabel(c)}. ` +
        `Excedente $${Math.round(exceso).toLocaleString('es-CO')} (cupo $${Math.round(max).toLocaleString('es-CO')}).`
      );
    }
  }

  /** Botones "no ha pagado" (amarillo) / "ya cayó" (verde) por orden. */
  marcarEstado(orden: ActiveP2POrder, estado: 'RECIBIDO' | 'PENDIENTE'): void {
    if (!orden.preAsignadoCopId) {
      this.notification.warn('Primero asigna la orden a una cuenta COP.');
      return;
    }
    const prev = orden.estadoManual;
    // Optimista: suma al verde / pasa a amarillo DE UNA VEZ, sin esperar al backend.
    orden.estadoManual = estado;
    const live = this.ordenes.find(o => o.orderNumber === orden.orderNumber);
    if (live) live.estadoManual = estado;
    // Override local: el refresco de 15s NO debe pisar lo que el usuario acaba de marcar.
    this.estadoManualLocal[orden.orderNumber] = estado;
    // Mover el monto de amarillo↔verde al instante en el registro visual.
    const ev = this.naranjaAsignada[orden.orderNumber];
    if (ev) ev.recibido = (estado === 'RECIBIDO');
    this.recomputarSaldos();

    this.syncService.setEstadoManual(orden.orderNumber, estado).subscribe({
      next: () => {
        this.notification.success(estado === 'RECIBIDO' ? 'Marcada: ya cayó (verde).' : 'Marcada: pendiente (amarillo).');
      },
      error: (err) => {
        // Revertir si el backend falló.
        orden.estadoManual = prev;
        if (live) live.estadoManual = prev;
        delete this.estadoManualLocal[orden.orderNumber];
        this.notification.error(err?.error?.error || 'No se pudo cambiar el estado.');
      }
    });
  }

  // ── Cupo del día ──────────────────────────────────────────────

  /** Cupo máximo del día para la cuenta, según el medio con el que se activó (cupoTipoP2P). */
  cupoMaxDeCuenta(c: AccountCop): number {
    const max = this.cupoMax[c.bankType];
    if (!max) return 0;
    if (c.cupoTipoP2P === 'CORRESPONSAL') return max.corresponsal;
    if (c.cupoTipoP2P === 'AMBOS')        return max.cajero + max.corresponsal;
    return max.cajero; // CAJERO por defecto
  }

  /** Pesos de las órdenes en curso ya pre-asignadas a esta cuenta. */
  private pesosEnCursoDe(copId: number | null | undefined): number {
    if (copId == null) return 0;
    return this.ordenes
      .filter(o => o.preAsignadoCopId === copId)
      .reduce((s, o) => s + (o.pesosCop ?? 0), 0);
  }

  /** True si la cuenta ya alcanzó (o superó) su cupo del día: saldo + ventas en curso pre-asignadas. */
  cupoLlenoDe(c: AccountCop): boolean {
    const max = this.cupoMaxDeCuenta(c);
    if (max <= 0) return false;
    return ((c.balance ?? 0) + this.pesosEnCursoDe(c.id)) >= max;
  }

  // ── Aviso automático de cupo lleno ────────────────────────────

  /** Revisa las cuentas activas; si alguna acaba de llenar su cupo, abre el aviso (una a la vez). */
  private verificarCuposLlenos(): void {
    if (this.showCupoLleno) return; // ya hay un aviso abierto
    for (const c of this.cuentasActivasP2P) {
      if (c.id == null) continue;
      if (this.cupoLlenoDe(c)) {
        if (!this.cupoLlenoAvisado.has(c.id)) {
          this.cupoLlenoAvisado.add(c.id);
          this.cupoLlenoCuenta = c;
          this.showCupoLleno = true;
          return; // una a la vez
        }
      } else {
        this.cupoLlenoAvisado.delete(c.id); // se liberó → puede volver a avisar
      }
    }
  }

  /** Mantener la cuenta activa para seguir usándola. */
  cupoLlenoSeguir(): void {
    this.showCupoLleno = false;
    this.cupoLlenoCuenta = null;
  }

  /** Desactivar la cuenta de P2P. */
  cupoLlenoDesactivar(): void {
    if (this.cupoLlenoCuenta) this.desactivarP2P(this.cupoLlenoCuenta);
    this.showCupoLleno = false;
    this.cupoLlenoCuenta = null;
  }

  /** Cambiar por otra: libera esta cuenta y avisa para activar otra en su lugar. */
  cupoLlenoCambiar(): void {
    if (this.cupoLlenoCuenta) this.desactivarP2P(this.cupoLlenoCuenta);
    this.showCupoLleno = false;
    this.cupoLlenoCuenta = null;
    this.notification.info('Cuenta liberada. Activa otra cuenta COP para reemplazarla.');
  }

  get hayActivasP2P(): boolean {
    return this.cuentasCop.some(c => c.activaParaP2P);
  }

  dropdownChanged(orden: ActiveP2POrder, copId: number | null): void {
    // Sin bloqueo: el cliente pidió advertencia (no prohibición). El aviso de exceso
    // de cupo se muestra tras guardar la pre-asignación (ver avisarSiExcedeCupo).

    // Spread para nuevo objeto → Angular detecta cambio inmediatamente en [ngModel]
    this.seleccionPendiente = { ...this.seleccionPendiente, [orden.orderNumber]: copId };

    // Registro VISUAL del naranja (100% cliente): sumar/quitar de una, sin esperar al servidor.
    if (copId) {
      const ex = this.naranjaAsignada[orden.orderNumber];
      this.naranjaAsignada[orden.orderNumber] = {
        copId,
        pesos: orden.pesosCop ?? ex?.pesos ?? 0,
        recibido: ex?.recibido ?? false,
      };
    } else {
      delete this.naranjaAsignada[orden.orderNumber];
    }
    this.recomputarSaldos();

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
