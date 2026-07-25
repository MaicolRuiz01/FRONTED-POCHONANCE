import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { AuthService } from '../core/services/auth.service';
import { JornadaService, ModoJornada } from '../core/services/jornada.service';
import { NotificationService } from '../core/services/notification.service';

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

    @ViewChild('menubutton') menuButton!: ElementRef;
    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(
        public layoutService: LayoutService,
        public auth: AuthService,
        private jornadaService: JornadaService,
        private notification: NotificationService
    ) {}

    ngOnInit(): void {
        // Solo los operarios registran jornada. Restaura el estado si ya había una en curso.
        if (this.auth.isOperario()) {
            this.jornadaService.actual().subscribe({
                next: est => {
                    if (est?.activa) {
                        this.inicioJornadaMs = Date.now() - (est.transcurridoSegundos ?? 0) * 1000;
                        this.jornadaActiva = true;
                        this.jornadaModo = est.modo ?? null;
                        this.startTick();
                    }
                },
                error: () => {}
            });
        }
    }

    ngOnDestroy(): void {
        this.stopTick();
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
                this.inicioJornadaMs = Date.now() - (est?.transcurridoSegundos ?? 0) * 1000;
                this.jornadaActiva = true;
                this.jornadaModo = est?.modo ?? modo;
                this.startTick();
                this.jornadaCargando = false;
                this.notification.success(
                    modo === 'VENTA_USDT'
                        ? '¡A vender USDT! Se avisará por Telegram si no entran órdenes.'
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

    private startTick(): void {
        this.stopTick();
        this.actualizarTranscurrido();
        this.tickTimer = setInterval(() => this.actualizarTranscurrido(), 1000);
    }

    private stopTick(): void {
        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }
    }

    private actualizarTranscurrido(): void {
        if (this.inicioJornadaMs == null) { this.transcurrido = '00:00:00'; return; }
        const seg = Math.max(0, Math.floor((Date.now() - this.inicioJornadaMs) / 1000));
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
