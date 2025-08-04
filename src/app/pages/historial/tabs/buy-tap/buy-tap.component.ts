import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../../../core/services/supplier.service';
import { MessageService } from 'primeng/api';
import { BuyDollarsDto, BuyDollarsService } from '../../../../core/services/buy-dollars.service';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown'; // ⬅️ IMPORTAR ESTO


@Component({
  selector: 'app-buy-tap',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ToastModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    DialogModule,
    FormsModule,
    DropdownModule
  ],
  templateUrl: './buy-tap.component.html',
  styleUrl: './buy-tap.component.css',
  providers: [MessageService]
})
export class BuyTapComponent implements OnInit {
  compras: BuyDollarsDto[] = [];
  selectedCompra: BuyDollarsDto | null = null;
  dialogVisible = false;
  suppliers: { id: number; name: string }[] = [];

  constructor(
    private buyService: BuyDollarsService,
    private supplierService: SupplierService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCompras();
     this.supplierService.getAllSuppliers().subscribe(s => this.suppliers = s.map(x => ({ id: x.id, name: x.name })));
  }

  loadCompras() {
    this.buyService.getComprasRegistradas().subscribe({
      next: data => this.compras = data,
      error: err => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se cargaron compras registradas' })
    });
  }

  editCompra(compra: BuyDollarsDto) {
    this.selectedCompra = { ...compra };
    this.dialogVisible = true;
  }

  recalculatePesos() {
    if (this.selectedCompra?.dollars != null && this.selectedCompra?.tasa != null) {
      this.selectedCompra.pesos = this.selectedCompra.dollars * this.selectedCompra.tasa;
    }
  }

  saveEdit() {
    if (!this.selectedCompra) return;
    // Aquí se debería usar updateBuyDollars(), lo usaremos cuando esté implementado en el servicio
    if (this.selectedCompra?.id) {
  this.buyService.updateBuyDollar(this.selectedCompra.id, this.selectedCompra).subscribe({
    next: _ => {
      this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Compra actualizada' });
      this.dialogVisible = false;
      this.loadCompras();
    },
    error: _ => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' })
  });
}
  }
}
