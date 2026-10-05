import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs/operators';

import { P2PSyncService, ChatMensaje } from '../../../core/services/p2p-sync.service';

/**
 * Conversación del chat de UNA orden P2P de Binance + caja para escribir.
 *
 * Se usa en dos lugares: el panel lateral de "Ventas en curso" (con el mensaje de la cuenta COP
 * ya armado) y la pestaña "Historial de chats". Mientras está en pantalla, la conversación se
 * refresca sola para ver las respuestas del cliente sin recargar.
 */
@Component({
  selector: 'app-chat-orden',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './chat-orden.component.html',
  styleUrls: ['./chat-orden.component.css']
})
export class ChatOrdenComponent implements OnChanges, OnDestroy {

  @Input() cuenta!: string;
  @Input() orderNumber!: string;
  /** true = al abrir, propone el mensaje con los datos de la cuenta COP asignada a la orden. */
  @Input() sugerirCuentaAsignada = false;
  /** Texto con el que arranca la caja (si no se pide el de la cuenta asignada). */
  @Input() textoInicial = '';

  /** Se emite cuando Binance confirma un mensaje enviado. */
  @Output() enviado = new EventEmitter<string>();

  @ViewChild('conv') convRef?: ElementRef<HTMLDivElement>;

  mensajes: ChatMensaje[] | null = null;
  cargando = false;
  error: string | null = null;

  texto = '';
  armandoTexto = false;
  enviando = false;
  errorEnvio: string | null = null;

  private pollTimer?: ReturnType<typeof setInterval>;
  private readonly POLL_MS = 8000;

  trackByMensaje = (i: number, m: ChatMensaje) => m.id ?? i;

  constructor(private syncService: P2PSyncService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cuenta'] || changes['orderNumber']) {
      this.mensajes = null;
      this.error = null;
      this.errorEnvio = null;
      this.texto = this.textoInicial ?? '';
      this.cargar();
      if (this.sugerirCuentaAsignada) this.armarMensajeCuenta();
      clearInterval(this.pollTimer);
      this.pollTimer = setInterval(() => this.cargar(true), this.POLL_MS);
    } else if (changes['textoInicial'] && !this.texto) {
      this.texto = this.textoInicial ?? '';
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.pollTimer);
  }

  /** silencioso = refresco automático: no marca "cargando" ni muestra errores pasajeros. */
  cargar(silencioso = false): void {
    const cuenta = this.cuenta;
    const orden = this.orderNumber;
    if (!cuenta || !orden || (silencioso && this.cargando)) return;
    if (!silencioso) this.cargando = true;
    this.syncService.getConversacionChat(cuenta, orden)
      .pipe(finalize(() => { if (!silencioso) this.cargando = false; }))
      .subscribe({
        next: r => {
          if (cuenta !== this.cuenta || orden !== this.orderNumber) return; // cambió la orden
          this.error = r.ok ? null : 'Binance respondió en un formato inesperado: ' + (r.respuestaCruda ?? '');
          const antes = this.mensajes?.length ?? 0;
          this.mensajes = r.mensajes ?? [];
          // Solo se baja al final si es la primera carga o llegó algo nuevo (respeta el scroll).
          if (!silencioso || this.mensajes.length !== antes) this.bajar();
        },
        error: err => {
          if (!silencioso) this.error = err?.error?.error ?? 'No se pudo leer el chat de la orden.';
        }
      });
  }

  /** Propone el mensaje con banco, número, titular y cédula de la cuenta COP asignada. */
  armarMensajeCuenta(): void {
    const orden = this.orderNumber;
    this.armandoTexto = true;
    this.syncService.getMensajeChat(orden)
      .pipe(finalize(() => this.armandoTexto = false))
      .subscribe({
        next: r => { if (orden === this.orderNumber) this.texto = r.texto; },
        error: err => this.errorEnvio = err?.error?.error ?? 'No se pudo armar el mensaje con la cuenta asignada.'
      });
  }

  get puedeEnviar(): boolean {
    return !!this.texto.trim() && !this.enviando && !!this.cuenta && !!this.orderNumber;
  }

  enviar(): void {
    if (!this.puedeEnviar) return;
    const orden = this.orderNumber;
    this.enviando = true;
    this.errorEnvio = null;
    this.syncService.enviarMensajeChat(this.cuenta, orden, this.texto)
      .pipe(finalize(() => this.enviando = false))
      .subscribe({
        next: r => {
          if (!r.ok) {
            this.errorEnvio = r.error ?? 'Binance no aceptó el mensaje.';
            return;
          }
          this.texto = '';
          this.enviado.emit(orden);
          this.cargar();
        },
        error: err => this.errorEnvio = err?.error?.error ?? 'No se pudo enviar el mensaje.'
      });
  }

  /** Enter envía; Shift+Enter hace salto de línea (como cualquier chat). */
  teclaEnTexto(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.enviar();
    }
  }

  private bajar(): void {
    setTimeout(() => {
      const el = this.convRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
