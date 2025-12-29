import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { CompraVesService, CompraVesDto } from '../../../../core/services/compra-ves.service';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SupplierService, Supplier } from '../../../../core/services/supplier.service';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
@Component({
  selector: 'app-compras-ves',
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
    RadioButtonModule
  ],
  templateUrl: './compras-ves.component.html',
  styleUrl: './compras-ves.component.css'
})
export class ComprasVesComponent implements OnInit {

  rows: CompraVesDto[] = [];
  suppliers: Supplier[] = [];
  clientes: Cliente[] = [];

  showForm = false;
  editingId: number | null = null;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private compraApi: CompraVesService,
    private supplierApi: SupplierService,
    private clienteApi: ClienteService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      bolivares: [null, Validators.required],
      tasa: [null, Validators.required],
      pesosPreview: [{ value: 0, disabled: true }],

      asignadoA: ['supplier', Validators.required], // supplier | cliente
      supplierId: [null],
      clienteId: [null],
    });

    // Preview pesos
    this.form.valueChanges.subscribe(v => {
      const bol = v.bolivares ?? 0;
      const tasa = v.tasa ?? 0;
      this.form.get('pesosPreview')?.setValue(bol * tasa, { emitEvent: false });
    });

    this.load();
    this.loadSuppliers();
    this.loadClientes();
  }

  load(): void {
    this.compraApi.list().subscribe(r => this.rows = r);
  }

  loadSuppliers(): void {
    this.supplierApi.getAllSuppliers().subscribe(r => this.suppliers = r);
  }

  loadClientes(): void {
    this.clienteApi.listar().subscribe(r => this.clientes = r);
  }

  new(): void {
    this.form.reset({
      asignadoA: 'supplier'
    });
    this.editingId = null;
    this.showForm = true;
  }

  cancel(): void {
    this.showForm = false;
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) return;

    const v = this.form.value;

    const payload: CompraVesDto = {
      bolivares: v.bolivares,
      tasa: v.tasa,
      supplier: v.asignadoA === 'supplier' ? { id: v.supplierId } : null,
      cliente: v.asignadoA === 'cliente' ? { id: v.clienteId } : null,
    };

    const obs = this.editingId
      ? this.compraApi.update(this.editingId, payload)
      : this.compraApi.create(payload);

    obs.subscribe(() => {
      this.load();
      this.cancel();
    });
  }

  edit(row: CompraVesDto): void {
    this.editingId = row.id ?? null;
    this.showForm = true;

    this.form.patchValue({
      bolivares: row.bolivares,
      tasa: row.tasa,
      asignadoA: row.supplier ? 'supplier' : 'cliente',
      supplierId: row.supplier?.id ?? null,
      clienteId: row.cliente?.id ?? null,
    });
  }

  remove(row: CompraVesDto): void {
    if (!row.id) return;
    if (!confirm('¿Eliminar compra? Esto revertirá la deuda.')) return;

    this.compraApi.delete(row.id).subscribe(() => this.load());
  }
}
