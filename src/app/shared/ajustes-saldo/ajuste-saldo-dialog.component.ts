import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import {
  MovimientoService,
  AjusteSaldoDto,
  EntidadAjuste
} from '../../core/services/movimiento.service';

@Component({
  selector: 'app-ajuste-saldo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    ButtonModule,
    SelectButtonModule,
    FormsModule
  ],
  templateUrl: './ajuste-saldo-dialog.component.html',
  styleUrls: ['./ajuste-saldo-dialog.component.css']
})
export class AjusteSaldoDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() entidad!: EntidadAjuste;
  @Input() entidadId!: number;
  @Input() nombreEntidad = '';
  @Input() saldoActual = 0;

  @Output() ajusteRealizado = new EventEmitter<void>();

  // Form
  monto: number | null = null;
  entrada: boolean = true; // true = suma, false = resta
  motivo: string = '';
  loading = false;

  // ✅ NUEVO: saldo base (real) y saldo editable/preview
  saldoBase = 0;
  saldoEdit: number | null = null;

  // para evitar loops entre (monto/entrada) <-> (saldoEdit)
  private syncing = false;

  modoOptions = [
    { label: 'Entrada (+)', value: true },
    { label: 'Salida (-)', value: false }
  ];

  constructor(private movimientoService: MovimientoService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando se abre el modal o cambia el saldoActual, reiniciamos
    if (changes['visible'] || changes['saldoActual'] || changes['entidadId']) {
      if (this.visible) {
        this.resetForm();
      }
    }
  }

  private resetForm() {
    this.saldoBase = Number(this.saldoActual ?? 0);
    this.saldoEdit = this.saldoBase;

    this.monto = null;
    this.entrada = true;
    this.motivo = '';
  }

  cerrar() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  // ✅ 1) Cuando cambie monto o entrada -> recalcular saldoEdit (preview)
  onMontoChange() {
    if (this.syncing) return;
    this.syncing = true;

    const m = Number(this.monto ?? 0);
    const base = Number(this.saldoBase ?? 0);

    const nuevo = this.entrada ? (base + m) : (base - m);
    this.saldoEdit = nuevo;

    this.syncing = false;
  }

  onTipoChange() {
    this.onMontoChange();
  }

  // ✅ 2) Cuando cambie el saldoEdit -> recalcular monto y detectar entrada/salida
  onSaldoEditChange() {
    if (this.syncing) return;
    this.syncing = true;

    const base = Number(this.saldoBase ?? 0);
    const edit = Number(this.saldoEdit ?? base);

    const diff = edit - base;

    if (diff >= 0) {
      this.entrada = true;
      this.monto = diff;
    } else {
      this.entrada = false;
      this.monto = Math.abs(diff);
    }

    this.syncing = false;
  }

  guardar() {
    if (!this.entidad || !this.entidadId) return;

    const m = Number(this.monto ?? 0);
    if (!m || m <= 0) {
      alert('Ingrese un monto mayor a 0');
      return;
    }
    if (!this.motivo.trim()) {
      alert('El motivo es obligatorio');
      return;
    }

    const dto: AjusteSaldoDto = {
      entidad: this.entidad,
      entidadId: this.entidadId,
      monto: m,
      entrada: this.entrada,
      motivo: this.motivo.trim(),
      actor: 'admin'
    };

    this.loading = true;
    this.movimientoService.ajustarSaldo(dto).subscribe({
      next: () => {
        alert('Ajuste registrado correctamente');
        this.loading = false;
        this.ajusteRealizado.emit();
        this.cerrar();
      },
      error: (err) => {
        console.error('Error al registrar el ajuste', err);
        alert('Error al registrar el ajuste');
        this.loading = false;
      }
    });
  }
}
