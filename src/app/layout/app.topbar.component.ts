import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { AuthService } from '../core/services/auth.service';
import { JornadaService, ModoJornada, JornadaEstado } from '../core/services/jornada.service';
import { JornadaSseService } from '../core/services/jornada-sse.service';
import { NotificationService } from '../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html'
})
export class AppTopBarComponent implements OnInit, OnDestroy {

    items!: MenuItem[];

    /** Jornada de trabajo ("Empecé a trabajar" / "Terminé"). */
    jornadaActiva = false;
    jornadaCargando = false;
    transcurrido = '00:00:00';
    /** Modo de la jornada en curso: en qué está trabajando el operador. */
    jornadaModo: ModoJornada | null = null;
    /** Diálogo para elegir el modo al iniciar la jornada. */
    mostrarSelectorModo = false;
    private inicioJornadaMs: number | null = null;
    private tickTimer: ReturnType<typeof setInterval> | null = null;

    // ── Vigilancia automática (control de operadores en ventas P2P) ──

    /** La vigilancia detuvo el cronómetro: el tiempo dejó de contar y de pagarse. */
    jornadaPausada = false;
    motivoPausa = '';
    reanudando = false;

    /** Aviso en pantalla (ej: "bájale un punto a la tasa"). */
    mostrarAviso = false;
    mensajeAviso = '';

    /** Segundos congelados mientras está en pausa (para que el cronómetro no avance). */
    private segundosCongelados = 0;

    private sseSubs: Subscription[] = [];
    /** Respaldo por HTTP: si el SSE se cae en Railway, igual se entera del estado real. */
    private estadoTimer: ReturnType<typeof setInterval> | null = null;
    private readonly ESTADO_POLL_MS = 30000;

    @ViewChild('menubutton') menuButton!: ElementRef;
    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(
        public layoutService: LayoutService,
        public auth: AuthService,
        private jornadaService: JornadaService,
        private jornadaSse: JornadaSseService,
        private notification: NotificationService,
        private zone: NgZone,
        private cdr: ChangeDetectorRef
    ) {}

    /** El cronómetro late un instante más después de destruir la vista; sin esto,
     *  detectChanges() sobre una vista ya destruida lanza error. */
    private destruido = false;

    ngOnInit(): void {
        // Solo los operarios registran jornada. Restaura el estado si ya había una en curso.
        if (!this.auth.isOperario()) return;

        this.jornadaService.actual().subscribe({
            next: est => this.aplicarEstado(est),
            error: () => {}
        });

        // Canal rápido: el aviso aparece al instante.
        this.jornadaSse.connect(this.auth.getUsername());
        this.sseSubs.push(
            this.jornadaSse.aviso$.subscribe(msg => this.mostrarAvisoOperador(msg)),
            this.jornadaSse.pausa$.subscribe(motivo => {
                // Se refresca contra el servidor para tomar el tiempo exacto ya descontado.
                this.refrescarEstado();
                this.mostrarAvisoOperador(motivo);
            }),
            this.jornadaSse.reanudada$.subscribe(() => this.refrescarEstado())
        );

        // Respaldo: aunque el SSE nunca conecte, el estado real llega igual cada 30 s.
        this.estadoTimer = setInterval(() => this.refrescarEstado(), this.ESTADO_POLL_MS);
    }

    ngOnDestroy(): void {
        this.destruido = true;
        this.stopTick();
        this.sseSubs.forEach(s => s.unsubscribe());
        this.jornadaSse.disconnect();
        if (this.estadoTimer) clearInterval(this.estadoTimer);
    }

    /** Trae el estado real del servidor (es la fuente de verdad, no el SSE). */
    private refrescarEstado(): void {
        if (!this.auth.isOperario()) return;
        this.jornadaService.actual().subscribe({
            next: est => this.aplicarEstado(est),
            error: () => {}
        });
    }

    /** Vuelca el estado del servidor al componente, incluida la pausa y el aviso pendiente. */
    private aplicarEstado(est: JornadaEstado | null): void {
        if (!est?.activa) {
            this.jornadaActiva = false;
            this.jornadaPausada = false;
            this.jornadaModo = null;
            this.stopTick();
            this.transcurrido = '00:00:00';
            this.inicioJornadaMs = null;
            return;
        }

        this.jornadaActiva = true;
        this.jornadaModo = est.modo ?? null;

        const seg = est.transcurridoSegundos ?? 0;
        this.jornadaPausada = !!est.pausada;
        this.motivoPausa = est.motivoPausa ?? '';

        if (this.jornadaPausada) {
            // Congelado: el cronómetro se queda quieto en el tiempo que sí se paga.
            this.segundosCongelados = seg;
            this.inicioJornadaMs = null;
            this.stopTick();
            this.pintarTiempo(seg);
        } else {
            this.inicioJornadaMs = Date.now() - seg * 1000;
            this.startTick();
        }

        // Aviso que quedó pendiente (por SSE caído o porque recargó la página).
        if (est.avisoPendiente && !this.mostrarAviso) {
            this.mostrarAvisoOperador(est.avisoPendiente);
        }
    }

    private mostrarAvisoOperador(msg: string): void {
        if (!msg) return;
        this.mensajeAviso = msg;
        this.mostrarAviso = true;
    }

    /** El operador cerró el aviso: se le confirma al servidor para que no se repita. */
    cerrarAviso(): void {
        this.mostrarAviso = false;
        this.jornadaService.marcarAvisoVisto().subscribe({ next: () => {}, error: () => {} });
    }

    /** Reanuda la jornada pausada. El tiempo detenido ya quedó descontado en el servidor. */
    reanudarJornada(): void {
        if (this.reanudando) return;
        this.reanudando = true;
        this.jornadaService.reanudar().subscribe({
            next: est => {
                this.reanudando = false;
                this.mostrarAviso = false;
                this.aplicarEstado(est);
                this.notification.success('Jornada reanudada. El cronómetro volvió a correr.');
            },
            error: () => {
                this.reanudando = false;
                this.notification.error('No se pudo reanudar la jornada.');
            }
        });
    }

    /** ¿Debe mostrarse el botón de jornada? */
    get mostrarJornada(): boolean {
        return this.auth.isOperario();
    }

    toggleJornada(): void {
        if (this.jornadaCargando) return;

        if (!this.jornadaActiva) {
            // Antes de arrancar, el operador elige en qué va a trabajar.
            this.mostrarSelectorModo = true;
            return;
        }

        this.jornadaCargando = true;
        this.jornadaService.finalizar().subscribe({
            next: () => {
                this.jornadaActiva = false;
                this.jornadaPausada = false;
                this.motivoPausa = '';
                this.mostrarAviso = false;
                this.jornadaModo = null;
                this.stopTick();
                this.transcurrido = '00:00:00';
                this.inicioJornadaMs = null;
                this.jornadaCargando = false;
                this.notification.success('Jornada finalizada. ¡Buen trabajo!');
            },
            error: () => {
                this.jornadaCargando = false;
                this.notification.error('No se pudo finalizar la jornada.');
            }
        });
    }

    /** Arranca la jornada con el modo elegido en el diálogo. */
    iniciarJornadaCon(modo: ModoJornada): void {
        if (this.jornadaCargando) return;
        this.jornadaCargando = true;
        this.mostrarSelectorModo = false;

        this.jornadaService.iniciar(modo).subscribe({
            next: est => {
                this.aplicarEstado(est);
                this.jornadaModo = est?.modo ?? modo;
                this.jornadaCargando = false;
                this.notification.success(
                    modo === 'VENTA_USDT'
                        ? '¡A vender USDT! Recuerda publicar el anuncio: si no hay ninguno en 10 minutos, el cronómetro se detiene.'
                        : '¡A hacer caja! Se registró el inicio de tu jornada.'
                );
            },
            error: () => {
                this.jornadaCargando = false;
                this.notification.error('No se pudo iniciar la jornada.');
            }
        });
    }

    /** Etiqueta legible del modo, para mostrar junto al cronómetro. */
    get modoLabel(): string {
        if (this.jornadaModo === 'VENTA_USDT') return 'Vendiendo USDT';
        if (this.jornadaModo === 'CAJA') return 'Haciendo caja';
        return '';
    }

    /**
     * Este cronómetro es el más caro de los tres, porque la barra superior está montada en
     * TODAS las pantallas: latía una vez por segundo, siempre, y cada latido obligaba a Angular
     * a revisar la aplicación completa aunque lo único que cambiara fuera el texto del reloj.
     *
     * Ahora late fuera de la zona y solo se refresca este componente.
     */
    private startTick(): void {
        this.stopTick();
        this.actualizarTranscurrido();
        this.zone.runOutsideAngular(() => {
            this.tickTimer = setInterval(() => {
                if (this.destruido) return;
                this.actualizarTranscurrido();
                this.cdr.detectChanges();
            }, 1000);
        });
    }

    private stopTick(): void {
        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }
    }

    private actualizarTranscurrido(): void {
        // En pausa el cronómetro no avanza: se queda en el tiempo que efectivamente se paga.
        if (this.jornadaPausada) { this.pintarTiempo(this.segundosCongelados); return; }
        if (this.inicioJornadaMs == null) { this.transcurrido = '00:00:00'; return; }
        this.pintarTiempo(Math.max(0, Math.floor((Date.now() - this.inicioJornadaMs) / 1000)));
    }

    private pintarTiempo(seg: number): void {
        const h = Math.floor(seg / 3600);
        const m = Math.floor((seg % 3600) / 60);
        const s = seg % 60;
        const p = (n: number) => String(n).padStart(2, '0');
        this.transcurrido = `${p(h)}:${p(m)}:${p(s)}`;
    }

    logout(): void {
        this.auth.logout();
    }
}
