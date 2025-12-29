import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { VentaVesService, VentaVesDto } from '../../../../core/services/venta-ves.service';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-ventas-ves',
  standalone: true,
  imports: [
    SharedModule,
    ReactiveFormsModule,
    CardModule,
    InputNumberModule,
    TableModule,
    ButtonModule,
    DialogModule
  ],
  templateUrl: './ventas-ves.component.html',
  styleUrl: './ventas-ves.component.css'
})
export class VentasVesComponent implements OnInit {

  rows: VentaVesDto[] = [];
  editingId: number | null = null;
  showForm = false;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: VentaVesService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      bolivares: [0, [Validators.required, Validators.min(0.0000001)]],
      tasa: [0, [Validators.required, Validators.min(0.0000001)]],
      pesosPreview: [{ value: 0, disabled: true }],

      // 👉 SOLO IDS (COINCIDE CON TU DTO)
      clienteId: [null],
      proveedorId: [null],
      cuentaCopId: [null],
    });

    this.form.valueChanges.subscribe(v => {
      const bol = v.bolivares ?? 0;
      const tasa = v.tasa ?? 0;
      this.form.get('pesosPreview')?.setValue(bol * tasa, { emitEvent: false });
    });

    this.load();
  }

  load(): void {
    this.api.list().subscribe(r => this.rows = r);
  }

  new(): void {
    this.reset();
    this.showForm = true;
  }

  cancel(): void {
    this.reset();
    this.showForm = false;
  }

  private buildPayload(): VentaVesDto {
    const v = this.form.value;

    return {
      bolivares: v.bolivares,
      tasa: v.tasa,

      clienteId: v.clienteId,
      proveedorId: v.proveedorId,
      cuentaCopId: v.cuentaCopId,
    };
  }

  submit(): void {
    if (this.form.invalid) return;

    const payload = this.buildPayload();

    const obs = this.editingId
      ? this.api.update(this.editingId, payload)
      : this.api.create(payload);

    obs.subscribe(() => {
      this.load();
      this.cancel();
    });
  }

  edit(row: VentaVesDto): void {
    this.editingId = row.id ?? null;
    this.showForm = true;

    this.form.patchValue({
      bolivares: row.bolivares,
      tasa: row.tasa,
      clienteId: row.clienteId ?? null,
      proveedorId: row.proveedorId ?? null,
      cuentaCopId: row.cuentaCopId ?? null,
    });
  }

  remove(row: VentaVesDto): void {
    if (!row.id) return;
    if (!confirm('¿Eliminar venta? Esto afecta balance COP.')) return;

    this.api.delete(row.id).subscribe(() => this.load());
  }

  reset(): void {
    this.editingId = null;
    this.form.reset({
      bolivares: 0,
      tasa: 0,
      clienteId: null,
      proveedorId: null,
      cuentaCopId: null
    });
  }
}
