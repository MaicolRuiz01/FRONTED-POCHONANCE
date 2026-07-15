import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { AuthService } from '../core/services/auth.service';
import { JornadaService } from '../core/services/jornada.service';
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
        this.jornadaCargando = true;

        if (!this.jornadaActiva) {
            this.jornadaService.iniciar().subscribe({
                next: est => {
                    this.inicioJornadaMs = Date.now() - (est?.transcurridoSegundos ?? 0) * 1000;
                    this.jornadaActiva = true;
                    this.startTick();
                    this.jornadaCargando = false;
                    this.notification.success('¡A trabajar! Se registró el inicio de tu jornada.');
                },
                error: () => {
                    this.jornadaCargando = false;
                    this.notification.error('No se pudo iniciar la jornada.');
                }
            });
        } else {
            this.jornadaService.finalizar().subscribe({
                next: () => {
                    this.jornadaActiva = false;
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
