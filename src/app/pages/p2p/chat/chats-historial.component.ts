import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import { P2PSyncService, OrdenRecienteChat, ChatCredencialPrueba } from '../../../core/services/p2p-sync.service';
import { ChatOrdenComponent } from './chat-orden.component';

/**
 * Pestaña "Historial de chats": órdenes P2P de las últimas horas de todas las cuentas Binance
 * (en curso, completadas y canceladas), identificadas por el nickname del cliente, y la
 * conversación de la que se elija.
 */
@Component({
  selector: 'app-chats-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatOrdenComponent],
  templateUrl: './chats-historial.component.html',
  styleUrls: ['./chats-historial.component.css']
})
export class ChatsHistorialComponent implements OnInit {

  /** Acceso al chat por cuenta Binance (también da la lista de cuentas). */
  cuentas: ChatCredencialPrueba[] = [];
  cargandoCuentas = false;

  horas = 24;
  readonly opcionesHoras = [24, 48, 72];
  /** null = todas las cuentas. */
  filtroCuenta: string | null = null;
  busqueda = '';

  ordenes: OrdenRecienteChat[] = [];
  /** Cacheada: se recalcula al cambiar órdenes o filtros, no en cada ciclo de la vista. */
  ordenesFiltradas: OrdenRecienteChat[] = [];
  cargandoOrdenes = false;
  /** Cuentas cuyo historial no se pudo leer (se avisan sin tapar las demás). */
  erroresOrdenes: string[] = [];

  seleccionada: OrdenRecienteChat | null = null;

  trackByOrden = (_: number, o: OrdenRecienteChat) => o.orderNumber;

  constructor(private syncService: P2PSyncService) {}

  ngOnInit(): void {
    this.cargarCuentas();
  }

  cargarCuentas(): void {
    this.cargandoCuentas = true;
    this.syncService.probarChat()
      .pipe(finalize(() => this.cargandoCuentas = false))
      .subscribe({
        next: r => {
          this.cuentas = r;
          this.cargarOrdenes();
        },
        error: () => this.erroresOrdenes = ['No se pudo leer la lista de cuentas Binance.']
      });
  }

  /** Pide a Binance el historial de cada cuenta en paralelo y lo junta, más nuevas primero. */
  cargarOrdenes(): void {
    const cuentas = this.cuentas.map(c => c.cuenta);
    if (!cuentas.length || this.cargandoOrdenes) return;
    this.cargandoOrdenes = true;
    const errores: string[] = [];
    forkJoin(cuentas.map(c => this.syncService.getOrdenesRecientesChat(c, this.horas).pipe(
      catchError(err => {
        errores.push(`${c}: ${err?.error?.error ?? 'no se pudo leer el historial'}`);
        return of([] as OrdenRecienteChat[]);
      })
    )))
      .pipe(
        map(listas => listas.flat().sort((a, b) => (b.createTime || 0) - (a.createTime || 0))),
        finalize(() => this.cargandoOrdenes = false)
      )
      .subscribe(lista => {
        this.ordenes = lista;
        this.erroresOrdenes = errores;
        this.filtrar();
      });
  }

  cambiarHoras(h: number): void {
    if (this.horas === h) return;
    this.horas = h;
    this.cargarOrdenes();
  }

  cambiarCuenta(c: string | null): void {
    this.filtroCuenta = c;
    this.filtrar();
  }

  filtrar(): void {
    const q = this.busqueda.trim().toLowerCase();
    this.ordenesFiltradas = this.ordenes.filter(o =>
      (!this.filtroCuenta || o.accountBinance === this.filtroCuenta)
      && (!q || (o.counterPartNickName ?? '').toLowerCase().includes(q) || o.orderNumber.includes(q)));
  }

  elegir(o: OrdenRecienteChat): void {
    this.seleccionada = o;
  }

  estadoCorto(status: string | null): string {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED') return 'Completada';
    if (s.startsWith('CANCEL')) return 'Cancelada';
    if (s === 'TRADING') return 'En curso';
    if (s === 'BUYER_PAYED') return 'Pagada';
    if (s === 'DISTRIBUTING') return 'Liberando';
    if (s === 'IN_APPEAL') return 'Apelación';
    return s || '—';
  }

  claseEstado(status: string | null): string {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED') return 'ch-estado--ok';
    if (s.startsWith('CANCEL')) return 'ch-estado--cancelada';
    if (s === 'IN_APPEAL') return 'ch-estado--apelacion';
    return 'ch-estado--curso';
  }

  monto(o: OrdenRecienteChat): string {
    return '$' + Math.round(Number(o.totalPrice) || 0).toLocaleString('es-CO');
  }
}
