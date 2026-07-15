import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { OperadorService, OperadorCard } from '../../core/services/operador.service';
import { NotificationService } from '../../core/services/notification.service';
import { RetiradoresComponent } from '../retiradores/retiradores.component';

@Component({
  selector: 'app-operadores',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, CalendarModule, TagModule,
    ProgressSpinnerModule, TabViewModule, DialogModule, DropdownModule,
    InputTextModule, InputNumberModule, ConfirmDialogModule,
    RetiradoresComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './operadores.component.html',
  styleUrls: ['./operadores.component.css']
})
export class OperadoresComponent implements OnInit {

  fecha: Date = new Date();
  cards: OperadorCard[] = [];
  loading = false;

  // Tarifa
  tarifa = 7500;
  editandoTarifa = false;
  tarifaTemp = 7500;
  guardandoTarifa = false;

  // Crear operador
  showCrear = false;
  nuevoUsername = '';
  nuevoPassword = '';
  nuevoRol: 'ADMIN' | 'OPERARIO' = 'OPERARIO';
  creando = false;

  // Restablecer clave
  showReset = false;
  resetId: number | null = null;
  resetUsername = '';
  resetPassword = '';
  reseteando = false;

  rolOptions = [
    { label: 'Operario', value: 'OPERARIO' },
    { label: 'Admin', value: 'ADMIN' }
  ];

  constructor(
    private operadorService: OperadorService,
    private notification: NotificationService,
    private confirm: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private fechaStr(): string {
    const d = this.fecha ?? new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  cargar(): void {
    this.loading = true;
    forkJoin({
      resumen: this.operadorService.getResumen(this.fechaStr()),
      tarifa: this.operadorService.getTarifa()
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ resumen, tarifa }) => {
          this.cards = resumen ?? [];
          this.tarifa = tarifa?.valorHora ?? 7500;
        },
        error: () => this.notification.error('No se pudo cargar el panel de operadores.')
      });
  }

  onFechaChange(): void {
    this.cargar();
  }

  // -- Formatos --
  formatTiempo(seg: number): string {
    const s = Math.max(0, Math.floor(seg ?? 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h} h ${m} m`;
    if (m > 0) return `${m} m`;
    return `${s} s`;
  }

  formatCop(n: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(n ?? 0);
  }

  rolSeverity(rol: string | null): 'danger' | 'info' | 'secondary' {
    if (rol === 'ADMIN') return 'danger';
    if (rol === 'OPERARIO') return 'info';
    return 'secondary';
  }

  get totalPago(): number {
    return this.cards.reduce((s, c) => s + (c.pagoCop ?? 0), 0);
  }

  // -- Copiar credenciales --
  copiarCredenciales(c: OperadorCard): void {
    if (!c.passwordPlano) {
      this.notification.warn('Este usuario no tiene la clave guardada. Restablécela para poder copiarla.');
      return;
    }
    const texto = `Usuario: ${c.username}\nContraseña: ${c.passwordPlano}`;
    navigator.clipboard.writeText(texto).then(
      () => this.notification.success(`Credenciales de ${c.username} copiadas.`),
      () => this.notification.error('No se pudieron copiar las credenciales.')
    );
  }

  // -- Crear operador --
  abrirCrear(): void {
    this.nuevoUsername = '';
    this.nuevoPassword = '';
    this.nuevoRol = 'OPERARIO';
    this.showCrear = true;
  }

  guardarCrear(): void {
    if (this.creando) return;
    const user = this.nuevoUsername.trim();
    if (!user || !this.nuevoPassword) {
      this.notification.warn('Usuario y contraseña son obligatorios.');
      return;
    }
    this.creando = true;
    this.operadorService.crear({ username: user, password: this.nuevoPassword, rol: this.nuevoRol })
      .pipe(finalize(() => this.creando = false))
      .subscribe({
        next: () => {
          this.notification.success('Operador creado correctamente.');
          this.showCrear = false;
          this.cargar();
        },
        error: err => this.notification.error(err?.error?.error ?? 'No se pudo crear el operador.')
      });
  }

  // -- Restablecer clave --
  abrirReset(c: OperadorCard): void {
    this.resetId = c.id;
    this.resetUsername = c.username;
    this.resetPassword = '';
    this.showReset = true;
  }

  guardarReset(): void {
    if (this.reseteando || this.resetId == null) return;
    if (!this.resetPassword) {
      this.notification.warn('Escribe la nueva contraseña.');
      return;
    }
    this.reseteando = true;
    this.operadorService.cambiarPassword(this.resetId, this.resetPassword)
      .pipe(finalize(() => this.reseteando = false))
      .subscribe({
        next: () => {
          this.notification.success(`Contraseña de ${this.resetUsername} actualizada.`);
          this.showReset = false;
          this.cargar();
        },
        error: () => this.notification.error('No se pudo actualizar la contrasena.')
      });
  }

  // -- Eliminar --
  confirmarEliminar(c: OperadorCard): void {
    this.confirm.confirm({
      header: 'Eliminar operador',
      message: `¿Seguro que quieres eliminar a "${c.username}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.operadorService.eliminar(c.id).subscribe({
          next: () => {
            this.notification.success('Operador eliminado.');
            this.cargar();
          },
          error: () => this.notification.error('No se pudo eliminar el operador.')
        });
      }
    });
  }

  // -- Tarifa --
  editarTarifa(): void {
    this.tarifaTemp = this.tarifa;
    this.editandoTarifa = true;
  }

  cancelarTarifa(): void {
    this.editandoTarifa = false;
  }

  guardarTarifa(): void {
    if (this.guardandoTarifa) return;
    const valor = Number(this.tarifaTemp);
    if (!Number.isFinite(valor) || valor < 0) {
      this.notification.warn('La tarifa debe ser un número válido.');
      return;
    }
    this.guardandoTarifa = true;
    this.operadorService.setTarifa(valor)
      .pipe(finalize(() => this.guardandoTarifa = false))
      .subscribe({
        next: () => {
          this.tarifa = valor;
          this.editandoTarifa = false;
          this.notification.success('Tarifa por hora actualizada.');
          this.cargar();
        },
        error: () => this.notification.error('No se pudo actualizar la tarifa.')
      });
  }
}
