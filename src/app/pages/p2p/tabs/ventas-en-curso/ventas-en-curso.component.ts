import { ChangeDetectorRef, Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { Subscription } from 'rxjs';
import { finalize, debounceTime } from 'rxjs/operators';
import { SaldosSseService } from '../../../../core/services/saldos-sse.service';

import { P2PSyncService, ActiveP2POrder, SaldoEnCurso } from '../../../../core/services/p2p-sync.service';
import { AccountCopService, AccountCop } from '../../../../core/services/account-cop.service';
import { P2PSseService } from '../../../../core/services/p2p-sse.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AnunciosService, AnuncioDto } from '../../../../core/services/anuncios.service';

@Component({
  selector: 'app-ventas-en-curso',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    TagModule, DropdownModule, TooltipModule, ProgressSpinnerModule, DialogModule,
    TabViewModule
  ],
  templateUrl: './ventas-en-curso.component.html',
  styleUrls: ['./ventas-en-curso.component.css']
})
export class VentasEnCursoComponent implements OnInit, OnDestroy {

  ordenes: ActiveP2POrder[] = [];

  /** Órdenes partidas por estado. La pestaña principal muestra solo las que están EN CURSO
   *  (el caso habitual); el resto —pago recibido, pendientes y apeladas— va en la otra, para
   *  que el operador no tenga que buscarlas entre decenas de filas.
   *  Se cachean en vez de calcularse con getters porque la vista se repinta cada segundo. */
  ordenesEnCurso: ActiveP2POrder[] = [];
  ordenesOtras: ActiveP2POrder[] = [];

  /** Estado que se considera "en curso" para la partición. */
  private readonly ESTADO_EN_CURSO = 'TRADING';
  cuentasCop: AccountCop[]  = [];
  /** Cuentas activas para P2P — cacheado (NO getter) para no recalcular en cada ciclo de CD. */
  cuentasActivasP2P: AccountCop[] = [];
  /** Opciones del dropdown de asignación — cacheadas. Solo se reconstruyen cuando cambian
   *  las cuentas o las órdenes, NO en cada ciclo de detección de cambios (que corre cada segundo). */
  copOptionsList: { label: string; value: number }[] = [];

  /** Saldos por cuenta, CACHEADOS. verde = saldo real; amarillo = ventas en curso asignadas;
   *  proyectado (lo que se muestra en amarillo) = verde + amarillo. */
  verdePorCuenta: Record<number, number> = {};
  amarilloPorCuenta: Record<number, number> = {};
  proyectadoPorCuenta: Record<number, number> = {};

  /** Lo "en curso" de cada cuenta, TAL COMO LO CALCULA EL BACKEND (/api/p2p/saldos-en-curso).
   *
   *  Antes la pantalla armaba el verde/amarillo sumando el saldo (BD) con las órdenes (Binance),
   *  que llegan por caminos y momentos distintos: al completarse una venta, un rato se contaba
   *  doble y otro rato desaparecía ("los saldos se ponen locos"). Ahora el backend lo suma desde
   *  las pre-asignaciones, en la misma lectura que el saldo real, y la pantalla solo lo pinta.
   *  Lo único local es el ajuste optimista mientras se guarda un cambio del operador. */
  private enCursoPorCuenta: Record<number, number> = {};

  /** Cambios que el operador acaba de hacer (asignar / quitar), por orden.
   *  Durante unos segundos se respetan por encima de lo que diga un refresco, porque ese refresco
   *  pudo haber salido ANTES de que el cambio se guardara. Pasado ese tiempo, manda el servidor
   *  (así, si otro operador cambia algo, esta pantalla también se entera). */
  private cambiosLocales: Record<string, { copId: number | null; hasta: number }> = {};
  private readonly VENTANA_CAMBIO_LOCAL_MS = 10000;
  /** Momento del último ajuste optimista: se descartan respuestas de saldos pedidas antes. */
  private ultimoCambioLocalMs = 0;
  /** Número de la última petición de saldos: si llegan desordenadas, se ignora la vieja. */
  private saldosReqSeq = 0;
  private saldosAplicadoSeq = 0;
  /** Cuántas cuentas trae el backend que la lista P2P no muestra (bloqueadas). Evita recargar
   *  la lista completa en cada refresco solo porque existen cuentas bloqueadas. */
  private cuentasOcultasConocidas = 0;

  loading = false;
  /** Refresco en segundo plano (no vacía la tabla, solo marca el botón). */
  refreshing = false;

  /** Interruptor de asignación automática de cuentas COP (estado global, viene del backend). */
  autoAsignacion = false;
  autoAsignacionCargando = false;

  /** Momento de la última respuesta CONFIRMADA por Binance. null = todavía no hubo ninguna. */
  private ultimaCargaOkMs: number | null = null;
  /** La última consulta falló. */
  errorCarga = false;
  /** Segundos desde la última confirmación (se refresca en el tick de 1s). */
  segundosDesdeConfirmacion = 0;
  /** A partir de acá la lista se considera NO confiable y se avisa en pantalla. */
  private readonly MAX_SEG_SIN_CONFIRMAR = 60;

  anuncios: AnuncioDto[] = [];

  /** AnuncioDto no trae id, así que la identidad es la cuenta más el tipo de anuncio:
   *  una cuenta no puede tener dos anuncios del mismo tipo a la vez. */
  trackByAnuncio = (i: number, a: AnuncioDto) =>
    a ? `${a.cuenta}|${a.tipo}` : i;
  loadingAnuncios = false;
  ultimaActualizacionAnuncios: string | null = null;

  /** Mapa de orderNumber → copId seleccionado en el dropdown (antes de guardar) */
  seleccionPendiente: Record<string, number | null> = {};

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
  /** Respaldo por si el SSE se cae (Railway). El SSE ya empuja los cambios al instante,
   *  así que esto es solo una red de seguridad: no hace falta que sea agresivo.
   *  Estaba en 5s y, con varias pantallas abiertas, saturaba el backend sin aportar nada. */
  private readonly SALDOS_POLL_MS = 20000;

  constructor(
    private syncService: P2PSyncService,
    private accountCopService: AccountCopService,
    private sseService: P2PSseService,
    private notification: NotificationService,
    private anunciosService: AnunciosService,
    private saldosSse: SaldosSseService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  /** El cronómetro sigue latiendo un instante después de destruir la vista; sin esto,
   *  detectChanges() sobre una vista ya destruida lanza error. */
  private destruido = false;

  ngOnInit(): void {
    this.loadCuentasCop();
    this.loadOrdenes();
    this.loadAnuncios();
    this.loadAutoAsignacion();
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
    this.destruido = true;
    this.sseSub?.unsubscribe();
    this.sseStatusSub?.unsubscribe();
    this.p2pSub?.unsubscribe();
    this.saldosSub?.unsubscribe();
    this.saldosSse.disconnect();
    clearInterval(this.countdownTimer);
    clearInterval(this.saldosPollTimer);
  }

  /** Refresco de saldos COP: saldo real + lo en curso (verde/amarillo) + cupos, calculado en el
   *  backend en una sola lectura. Se llama al cargar órdenes, por SSE, tras cada cambio del
   *  operador y por el polling de respaldo. */
  private refrescarSaldosCop(): void {
    const seq = ++this.saldosReqSeq;
    const pedidoEn = Date.now();
    this.syncService.getSaldosEnCurso().subscribe({
      next: (saldos: SaldoEnCurso[]) => {
        // Respuesta vieja (llegó después de una más nueva) → no pisar datos más frescos.
        if (seq < this.saldosAplicadoSeq) return;
        // Pedida ANTES del último cambio del operador → puede no incluirlo; ya viene otra.
        if (pedidoEn < this.ultimoCambioLocalMs) return;
        this.saldosAplicadoSeq = seq;
        this.saldosEnCursoFallando = false;

        // ¿Apareció una cuenta COP nueva? Se recarga la lista completa para que salga sola.
        // El backend también manda las bloqueadas (que la lista P2P no muestra), así que solo
        // se recarga cuando cambia la cantidad de cuentas desconocidas.
        const idsActuales = new Set(this.cuentasCop.map(c => c.id));
        const desconocidas = saldos.filter(x => !idsActuales.has(x.id)).length;
        if (desconocidas !== this.cuentasOcultasConocidas) {
          this.cuentasOcultasConocidas = desconocidas;
          this.loadCuentasCop();
        }

        const enCurso: Record<number, number> = {};
        for (const x of saldos) enCurso[x.id] = Number(x.enCurso) || 0;
        this.enCursoPorCuenta = enCurso;

        const map = new Map(saldos.map(x => [x.id, x]));
        this.cuentasCop.forEach(c => {
          if (c.id != null && map.has(c.id)) {
            const x = map.get(c.id)!;
            c.balance = x.balance;
            if (x.cupoCajeroDisponibleHoy != null) c.cupoCajeroDisponibleHoy = x.cupoCajeroDisponibleHoy;
            if (x.cupoCorresponsalDisponibleHoy != null) c.cupoCorresponsalDisponibleHoy = x.cupoCorresponsalDisponibleHoy;
          }
        });
        this.recomputarVistaCop();
      },
      // OJO — antes esto era silencioso y NO tocaba nada. Resultado: cada asignación le sumaba su
      // monto al amarillo en pantalla (ajuste optimista) y, como el servidor nunca respondía bien,
      // nada lo corregía jamás: las ventas ya completadas seguían sumando y el amarillo crecía todo
      // el día hasta diferencias absurdas. Ahora, si el servidor falla, lo en curso se recalcula
      // desde las órdenes VISIBLES (nunca puede sumar más que lo que hay en la tabla) y el saldo
      // real se trae por el endpoint liviano de siempre.
      error: (err) => {
        if (seq < this.saldosAplicadoSeq) return;
        this.saldosAplicadoSeq = seq;
        if (!this.saldosEnCursoFallando) {
          console.error('[VentasEnCurso] /api/p2p/saldos-en-curso falló; se usa el respaldo desde las órdenes visibles', err);
        }
        this.saldosEnCursoFallando = true;
        this.enCursoPorCuenta = this.enCursoDesdeOrdenesVisibles();
        this.recomputarVistaCop();
        this.accountCopService.getSaldos().subscribe({
          next: saldos => {
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
          error: () => { /* sin saldo nuevo: se queda el último conocido */ }
        });
      }
    });
  }

  /** true mientras el endpoint de saldos en curso esté fallando (se usa el respaldo). */
  saldosEnCursoFallando = false;

  /** Respaldo: lo en curso de cada cuenta = suma de las órdenes visibles asignadas a ella. */
  private enCursoDesdeOrdenesVisibles(): Record<number, number> {
    const r: Record<number, number> = {};
    for (const o of this.ordenes) {
      if (o.preAsignadoCopId == null) continue;
      r[o.preAsignadoCopId] = (r[o.preAsignadoCopId] ?? 0) + (Number(o.pesosCop) || 0);
    }
    return r;
  }

  // ── Countdown ────────────────────────────────────────────────

  /**
   * El tick corre FUERA de la zona de Angular a propósito.
   *
   * Por defecto, cualquier setInterval dentro de la zona hace que Angular revise TODA la
   * aplicación —los 64 componentes y todas sus expresiones— en cada latido. Con este reloj más
   * el de la barra superior y el de operadores, eso pasaba tres veces por segundo, siempre,
   * aunque no hubiera cambiado nada.
   *
   * Corriendo afuera, el latido no dispara nada; al final refrescamos SOLO este componente con
   * detectChanges(). El usuario ve exactamente lo mismo, pero el trabajo es una fracción.
   */
  private startCountdown(): void {
    this.countdown = this.REFRESH_INTERVAL;
    this.zone.runOutsideAngular(() => {
      this.countdownTimer = setInterval(() => {
        if (this.destruido) return;

        this.countdown--;
        // Antigüedad de la lista: si lleva mucho sin confirmarse, la vista lo avisa.
        if (this.ultimaCargaOkMs != null) {
          this.segundosDesdeConfirmacion = Math.floor((Date.now() - this.ultimaCargaOkMs) / 1000);
        }
        if (this.countdown <= 0) {
          this.countdown = this.REFRESH_INTERVAL;
          // loadOrdenes hace una petición HTTP: vuelve a la zona para que, cuando llegue la
          // respuesta, Angular se entere y pinte las órdenes nuevas.
          this.zone.run(() => this.loadOrdenes());
          return;
        }

        // Refresca solo este componente y sus hijos, no la aplicación entera.
        this.cdr.detectChanges();
      }, 1000);
    });
  }

  resetCountdown(): void {
    this.countdown = this.REFRESH_INTERVAL;
  }

  // ── Asignación automática ─────────────────────────────────────

  /** Lee el estado del interruptor (global) al entrar a la vista. */
  loadAutoAsignacion(): void {
    this.syncService.getAutoAsignacion().subscribe({
      next: r => this.autoAsignacion = !!r?.activa,
      error: () => { /* silencioso: si falla, queda en OFF visual */ }
    });
  }

  /** Prende/apaga la asignación automática de cuentas COP a las ventas en curso. */
  toggleAutoAsignacion(): void {
    if (this.autoAsignacionCargando) return;
    this.autoAsignacionCargando = true;
    const nuevo = !this.autoAsignacion;
    this.syncService.setAutoAsignacion(nuevo)
      .pipe(finalize(() => this.autoAsignacionCargando = false))
      .subscribe({
        next: r => {
          this.autoAsignacion = !!r?.activa;
          this.notification.success(this.autoAsignacion
            ? 'Asignación automática ACTIVADA. El sistema asignará las cuentas COP solo.'
            : 'Asignación automática apagada. Vuelve al modo manual.');
          if (this.autoAsignacion) { this.loadOrdenes(); this.resetCountdown(); }
        },
        error: () => this.notification.error('No se pudo cambiar la asignación automática.')
      });
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
          // Respuesta confirmada por Binance: a partir de acá la lista es de fiar.
          this.ultimaCargaOkMs = Date.now();
          this.errorCarga = false;
          this.segundosDesdeConfirmacion = 0;

          // Cambios recientes del operador: se respetan unos segundos (este refresco pudo salir
          // antes de que se guardaran). Los vencidos o de órdenes que ya no están, se descartan.
          const ahora = Date.now();
          const numerosNuevos = new Set(data.map(o => o.orderNumber));
          for (const on of Object.keys(this.cambiosLocales)) {
            if (this.cambiosLocales[on].hasta <= ahora || !numerosNuevos.has(on)) delete this.cambiosLocales[on];
          }
          for (const o of data) {
            const cl = this.cambiosLocales[o.orderNumber];
            if (!cl) continue;
            o.preAsignadoCopId = cl.copId;
            o.preAsignadoCopNombre = cl.copId != null
              ? (this.cuentasCop.find(c => c.id === cl.copId)?.name ?? o.preAsignadoCopNombre)
              : null;
          }
          this.ordenes = data;

          // El dropdown refleja exactamente lo asignado (servidor + cambios recientes).
          const sel: Record<string, number | null> = {};
          for (const o of data) sel[o.orderNumber] = o.preAsignadoCopId ?? null;
          this.seleccionPendiente = sel;

          // Órdenes y saldos se refrescan JUNTOS: si una venta acaba de completarse, su monto
          // pasa de "en curso" al saldo real en la misma foto del backend.
          this.refrescarSaldosCop();

          this.particionarOrdenes();
          // Las órdenes afectan el label "cupo lleno" del dropdown → recomputar opciones.
          this.recomputarVistaCop();
        },
        // OJO: al fallar NO se vacía la lista a propósito (un corte de un segundo no debe
        // borrar órdenes reales que el operador está gestionando), pero SÍ se marca como no
        // confirmada. Sin esta marca, un fallo sostenido dejaba en pantalla órdenes que ya no
        // existían en Binance y el operador podía pre-asignarles plata que nunca iba a llegar.
        error: () => {
          this.errorCarga = true;
          this.notification.error('No se pudo confirmar las órdenes con Binance.');
        }
      });
  }

  /** Separa las órdenes en las dos pestañas. Se llama cada vez que llega una lista nueva. */
  private particionarOrdenes(): void {
    const enCurso: ActiveP2POrder[] = [];
    const otras: ActiveP2POrder[] = [];
    for (const o of this.ordenes) {
      if ((o.status || '').toUpperCase() === this.ESTADO_EN_CURSO) enCurso.push(o);
      else otras.push(o);
    }
    this.ordenesEnCurso = enCurso;
    this.ordenesOtras = otras;
  }

  /** True si la lista lleva demasiado tiempo sin confirmarse contra Binance. */
  get listaNoConfirmada(): boolean {
    if (this.ultimaCargaOkMs == null) return this.errorCarga;
    return this.errorCarga && this.segundosDesdeConfirmacion >= this.MAX_SEG_SIN_CONFIRMAR;
  }

  /** Texto legible de hace cuánto se confirmó la lista por última vez. */
  get desdeUltimaConfirmacion(): string {
    if (this.ultimaCargaOkMs == null) return 'nunca';
    const s = this.segundosDesdeConfirmacion;
    if (s < 60) return `hace ${s} s`;
    const m = Math.floor(s / 60);
    return m < 60 ? `hace ${m} min` : `hace ${Math.floor(m / 60)} h`;
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

  /** Guarda la pre-asignación. prevCopId: a qué cuenta estaba antes, para deshacer si falla. */
  private guardarPreAsignacion(orden: ActiveP2POrder, copId: number, prevCopId: number | null): void {
    const orderNumber = orden.orderNumber;
    this.syncService.savePreAsignacion({
      orderNumber,
      copId,
      accountBinance: orden.accountBinance,
      pesosCop: orden.pesosCop
    }).subscribe({
      next: () => {
        this.extenderCambioLocal(orderNumber);
        this.refrescarSaldosCop();
        // Sin toast de "guardada": el cliente lo pidió quitar (molestaba en cada asignación).
        // La confirmación visual es la sub-fila "Cuando complete → cuenta".
        // Aviso (NO bloqueo) si con esta asignación la cuenta se pasa del cupo.
        this.avisarSiExcedeCupo(copId);
      },
      // El guardado FALLÓ → se deshace lo pintado de forma optimista y se vuelve a lo que había.
      // Se muestra el motivo REAL que manda el servidor en vez de un texto genérico.
      error: (err) => {
        // Sin toast de error (el cliente lo pidió quitar): el dropdown vuelve solo a como estaba,
        // y esa es la señal de que no se guardó. El motivo queda en la consola para diagnóstico.
        this.revertirCambioLocal(orden, prevCopId);
        console.error('[VentasEnCurso] No se guardó la pre-asignación', orderNumber, err?.error?.error ?? err);
      }
    });
  }

  private quitarPreAsignacion(orden: ActiveP2POrder, prevCopId: number | null): void {
    const orderNumber = orden.orderNumber;
    this.syncService.deletePreAsignacion(orderNumber).subscribe({
      next: () => {
        this.extenderCambioLocal(orderNumber);
        this.refrescarSaldosCop();
      },
      error: (err) => {
        // Igual que al guardar: sin toast, el dropdown vuelve a la cuenta que tenía.
        this.revertirCambioLocal(orden, prevCopId);
        console.error('[VentasEnCurso] No se quitó la pre-asignación', orderNumber, err?.error?.error ?? err);
      }
    });
  }

  // ── Cambios locales (optimistas) ──────────────────────────────

  /** Aplica una asignación del operador en pantalla AL INSTANTE (orden, dropdown y saldos),
   *  antes de que responda el servidor. Luego el refresco del backend lo confirma. */
  private aplicarCambioLocal(orden: ActiveP2POrder, copId: number | null): void {
    this.moverMontoLocal(orden.pesosCop, orden.preAsignadoCopId ?? null, copId);
    this.asignarEnPantalla(orden, copId);
    this.cambiosLocales[orden.orderNumber] = { copId, hasta: Date.now() + this.VENTANA_CAMBIO_LOCAL_MS };
    this.recomputarVistaCop();
  }

  /** El servidor confirmó: el cambio se sigue respetando unos segundos más (por refrescos en vuelo). */
  private extenderCambioLocal(orderNumber: string): void {
    const cl = this.cambiosLocales[orderNumber];
    if (cl) cl.hasta = Date.now() + this.VENTANA_CAMBIO_LOCAL_MS;
  }

  /** El servidor rechazó el cambio: se vuelve a como estaba y se piden los saldos reales. */
  private revertirCambioLocal(orden: ActiveP2POrder, prevCopId: number | null): void {
    delete this.cambiosLocales[orden.orderNumber];
    this.asignarEnPantalla(orden, prevCopId);
    // Los saldos optimistas ya no valen: se piden los del servidor (sin descartar la respuesta).
    this.ultimoCambioLocalMs = 0;
    this.refrescarSaldosCop();
  }

  /** Refleja una cuenta asignada (o ninguna) en la orden y en el dropdown. */
  private asignarEnPantalla(orden: ActiveP2POrder, copId: number | null): void {
    const nombre = copId != null ? (this.cuentasCop.find(c => c.id === copId)?.name ?? '') : null;
    for (const o of [orden, this.ordenes.find(x => x.orderNumber === orden.orderNumber)]) {
      if (!o) continue;
      o.preAsignadoCopId = copId;
      o.preAsignadoCopNombre = nombre;
    }
    this.seleccionPendiente = { ...this.seleccionPendiente, [orden.orderNumber]: copId };
  }

  /** Mueve el monto de una orden de una cuenta a otra en los saldos en curso (solo pantalla). */
  private moverMontoLocal(pesos: number | null | undefined, deCop: number | null, aCop: number | null): void {
    const monto = Number(pesos ?? 0) || 0;
    if (deCop != null) this.enCursoPorCuenta[deCop] = (this.enCursoPorCuenta[deCop] ?? 0) - monto;
    if (aCop != null)  this.enCursoPorCuenta[aCop]  = (this.enCursoPorCuenta[aCop] ?? 0) + monto;
    this.ultimoCambioLocalMs = Date.now();
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

  /** Texto legible del tipo de cuenta. Las cuentas viejas no lo tienen: se asume Ahorros,
   *  que es el default con el que quedaron al agregar el campo. */
  tipoCuentaLabel(c: AccountCop): string {
    return c.tipoCuenta === 'CORRIENTE' ? 'Corriente' : 'Ahorros';
  }

  /** Copia al portapapeles los datos de la cuenta COP: nombre, banco, tipo, cédula y número. */
  copiarCuenta(c: AccountCop): void {
    const lineas = [
      `Nombre: ${c.name || '—'}`,
      `Banco: ${c.bankType || '—'}`,
      `Tipo de cuenta: ${this.tipoCuentaLabel(c)}`,
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

  // ── Saldos verde (saldo real) / amarillo (ventas en curso) por cuenta ──

  /** Recalcula verde / amarillo / proyectado de todas las cuentas a partir del saldo real y de lo
   *  en curso que manda el backend (más el ajuste optimista, si hay un cambio guardándose). */
  private recomputarSaldos(): void {
    const verde: Record<number, number> = {};
    const amarillo: Record<number, number> = {};
    const proyectado: Record<number, number> = {};

    // Number(...) defensivo: si algún valor llega como string, evita que "+" concatene texto.
    for (const c of this.cuentasCop) {
      if (c.id == null) continue;
      const enCurso = Math.max(0, Number(this.enCursoPorCuenta[c.id] ?? 0) || 0);
      verde[c.id] = Number(c.balance ?? 0) || 0;
      amarillo[c.id] = enCurso;
      proyectado[c.id] = verde[c.id] + enCurso;
    }

    this.verdePorCuenta = verde;
    this.amarilloPorCuenta = amarillo;
    this.proyectadoPorCuenta = proyectado;
  }

  /** VERDE: saldo real de la cuenta (las ventas suman acá cuando se completan e importan). */
  saldoVerdeDe(c: AccountCop): number {
    return c.id != null ? (this.verdePorCuenta[c.id] ?? (c.balance ?? 0)) : (c.balance ?? 0);
  }

  /** Ventas en curso asignadas a la cuenta — se usa para el aviso de cupo y el *ngIf. */
  saldoAmarilloDe(c: AccountCop): number {
    return c.id != null ? (this.amarilloPorCuenta[c.id] ?? 0) : 0;
  }

  /** AMARILLO que se MUESTRA: con cuánto quedará la cuenta cuando se completen sus ventas
   *  en curso = saldo real + ventas en curso asignadas. */
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

  // ── Cupo del día ──────────────────────────────────────────────

  /** Cupo máximo del día para la cuenta, según el medio con el que se activó (cupoTipoP2P). */
  cupoMaxDeCuenta(c: AccountCop): number {
    const max = this.cupoMax[c.bankType];
    if (!max) return 0;
    if (c.cupoTipoP2P === 'CORRESPONSAL') return max.corresponsal;
    if (c.cupoTipoP2P === 'AMBOS')        return max.cajero + max.corresponsal;
    return max.cajero; // CAJERO por defecto
  }

  /** True si la cuenta ya alcanzó (o superó) su cupo del día: saldo + ventas en curso pre-asignadas. */
  cupoLlenoDe(c: AccountCop): boolean {
    const max = this.cupoMaxDeCuenta(c);
    if (max <= 0) return false;
    return this.saldoProyectadoDe(c) >= max;
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
    const prevCop = orden.preAsignadoCopId ?? null;
    if ((copId ?? null) === prevCop) return;

    // Pantalla primero (saldos incluidos), servidor después.
    this.aplicarCambioLocal(orden, copId ?? null);

    if (copId) {
      // Recordar la última cuenta asignada para el botón "=".
      this.ultimaCopId = copId;
      this.ultimaCopNombre = this.cuentasCop.find(c => c.id === copId)?.name ?? '';
      this.guardarPreAsignacion(orden, copId, prevCop);
    } else if (prevCop) {
      this.quitarPreAsignacion(orden, prevCop);
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
