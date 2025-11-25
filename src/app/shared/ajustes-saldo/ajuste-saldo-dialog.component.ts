import { Component, EventEmitter, Input, Output } from '@angular/core';
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
export class AjusteSaldoDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() entidad!: EntidadAjuste;  // 'CLIENTE' | 'PROVEEDOR' | 'CUENTACOP' | 'CAJA'
  @Input() entidadId!: number;
  @Input() nombreEntidad = '';
  @Input() saldoActual = 0;

  @Output() ajusteRealizado = new EventEmitter<void>();

  monto: number | null = null;
  entrada: boolean = true; // true = suma, false = resta
  motivo: string = '';
  loading = false;

  modoOptions = [
    { label: 'Entrada (+)', value: true },
    { label: 'Salida (-)',  value: false }
  ];

  constructor(private movimientoService: MovimientoService) {}

  cerrar() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  guardar() {
    if (!this.entidad || !this.entidadId) return;
    if (!this.monto || this.monto <= 0) {
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
      monto: this.monto,
      entrada: this.entrada,
      motivo: this.motivo,
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
