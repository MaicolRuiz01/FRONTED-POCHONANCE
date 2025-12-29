import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';

import { VentaVesService, VentaVesDto } from '../../../../core/services/venta-ves.service';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
import { SupplierService, Supplier } from '../../../../core/services/supplier.service';

import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DividerModule } from 'primeng/divider';

// ✅ Si ya tienes AccountCopService, reemplaza esto por el tuyo
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment/environment';

export interface AccountCop {
  id: number;
  name: string;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class AccountCopService {
  private api = `${environment.apiUrl}/account-cop`; // AJUSTA tu endpoint real
  constructor(private http: HttpClient) {}
  list(): Observable<AccountCop[]> {
    return this.http.get<AccountCop[]>(`${this.api}/listar`); // AJUSTA si tu ruta es diferente
  }
}

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
    DialogModule,
    DropdownModule,
    RadioButtonModule,
    DividerModule
  ],
  templateUrl: './ventas-ves.component.html',
  styleUrl: './ventas-ves.component.css'
})
export class VentasVesComponent implements OnInit {

  rows: VentaVesDto[] = [];
  editingId: number | null = null;
  showForm = false;

  clientes: Cliente[] = [];
  suppliers: Supplier[] = [];
  cuentasCop: AccountCop[] = [];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: VentaVesService,
    private clienteService: ClienteService,
    private supplierService: SupplierService,
    private accountCopService: AccountCopService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      bolivares: [null, [Validators.required, Validators.min(0.0000001)]],
      tasa: [null, [Validators.required, Validators.min(0.0000001)]],
      pesosPreview: [{ value: 0, disabled: true }],

      // ✅ 1 de 3
      asignadoA: ['cuenta', Validators.required], // 'cuenta' | 'cliente' | 'proveedor'

      // ids para UI
      cuentaCopId: [null],
      clienteId: [null],
      proveedorId: [null],
    });

    // pesos preview
    this.form.valueChanges.subscribe(v => {
      const bol = Number(v.bolivares ?? 0);
      const tasa = Number(v.tasa ?? 0);
      this.form.get('pesosPreview')?.setValue(bol * tasa, { emitEvent: false });
    });

    // cuando cambie asignadoA, limpiar los otros
    this.form.get('asignadoA')?.valueChanges.subscribe(mode => {
      if (mode === 'cuenta') {
        this.form.patchValue({ clienteId: null, proveedorId: null }, { emitEvent: false });
      } else if (mode === 'cliente') {
        this.form.patchValue({ cuentaCopId: null, proveedorId: null }, { emitEvent: false });
      } else if (mode === 'proveedor') {
        this.form.patchValue({ cuentaCopId: null, clienteId: null }, { emitEvent: false });
      }
    });

    this.load();
    this.loadLookups();
  }

  load(): void {
    this.api.list().subscribe(r => this.rows = r);
  }

  loadLookups(): void {
    this.clienteService.listar().subscribe(r => this.clientes = r);
    this.supplierService.getAllSuppliers().subscribe(r => this.suppliers = r);

    // Si tu endpoint no es /account-cop/listar, AJUSTA en AccountCopService
    this.accountCopService.list().subscribe(r => this.cuentasCop = r);
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
    const v = this.form.getRawValue();

    const payload: VentaVesDto = {
      bolivares: Number(v.bolivares),
      tasa: Number(v.tasa),
      cliente: null,
      proveedor: null,
      cuentaCop: null
    };

    if (v.asignadoA === 'cuenta') payload.cuentaCop = { id: Number(v.cuentaCopId) };
    if (v.asignadoA === 'cliente') payload.cliente = { id: Number(v.clienteId) };
    if (v.asignadoA === 'proveedor') payload.proveedor = { id: Number(v.proveedorId) };

    return payload;
  }

  submit(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    // ✅ Validación fuerte: UNA sola selección según asignadoA
    if (v.asignadoA === 'cuenta' && !v.cuentaCopId) return alert('Seleccione una Cuenta COP');
    if (v.asignadoA === 'cliente' && !v.clienteId) return alert('Seleccione un Cliente');
    if (v.asignadoA === 'proveedor' && !v.proveedorId) return alert('Seleccione un Proveedor');

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

    const mode =
      row.cuentaCop?.id ? 'cuenta' :
      row.cliente?.id ? 'cliente' :
      'proveedor';

    this.form.patchValue({
      bolivares: row.bolivares,
      tasa: row.tasa,
      asignadoA: mode,
      cuentaCopId: row.cuentaCop?.id ?? null,
      clienteId: row.cliente?.id ?? null,
      proveedorId: row.proveedor?.id ?? null,
    });
  }

  remove(row: VentaVesDto): void {
    if (!row.id) return;
    if (!confirm('¿Eliminar venta? Esto revierte el efecto (balance/deuda).')) return;

    this.api.delete(row.id).subscribe(() => this.load());
  }

  reset(): void {
    this.editingId = null;
    this.form.reset({
      bolivares: null,
      tasa: null,
      pesosPreview: 0,
      asignadoA: 'cuenta',
      cuentaCopId: null,
      clienteId: null,
      proveedorId: null
    });
  }

  // Helpers UI
  get asignadoLabel(): string {
    const r = this.form.get('asignadoA')?.value;
    if (r === 'cuenta') return 'Cuenta COP';
    if (r === 'cliente') return 'Cliente';
    return 'Proveedor';
  }
}
