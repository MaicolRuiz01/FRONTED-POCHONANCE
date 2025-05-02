// asignaciones‑ventap2p.component.ts
import { Component, OnInit } from '@angular/core';
import { OrderP2PService, OrderP2PDto } from '../../../../../core/services/orderp2p.service';
import { AccountCopService, AccountCop } from '../../../../../core/services/account-cop.service';
import { SaleP2PService, SaleP2PDto } from '../../../../../core/services/sale-p2p.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-asignaciones-ventap2p',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    MultiSelectModule,
    ButtonModule,
    FormsModule,
    CalendarModule
  ],
  templateUrl: './asignaciones-ventap2p.component.html'
})
export class AsignacionesVentap2pComponent implements OnInit {
  p2pOrders: OrderP2PDto[]      = [];
  cuentasDisponibles: AccountCop[] = [];

  displayDialog     = false;
  selectedOrder!: OrderP2PDto;
  selectedAccountIds: number[]   = [];
  selectedAmounts: { [key:number]: number } = {};
  totalAsignado     = 0;
  saldoRestante     = 0;

  startDate: Date | null = null;
  endDate:   Date | null = null;

  constructor(
    private orderService: OrderP2PService,
    private saleService: SaleP2PService,
    private accountCopService: AccountCopService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadCuentas();
  }

  private loadOrders(): void {
    this.orderService.getAllOrders()
      .subscribe(data => this.p2pOrders = data);
  }

  private loadCuentas(): void {
    this.accountCopService.getAll()
      .subscribe(c => this.cuentasDisponibles = c);
  }

  abrirAsignacion(order: OrderP2PDto) {
    this.selectedOrder      = order;
    this.selectedAccountIds = [];
    this.selectedAmounts    = {};
    this.totalAsignado      = 0;
    this.saldoRestante      = order.totalPrice;
    this.displayDialog      = true;
  }

  onAccountSelectionChange() {
    this.selectedAmounts = {};
    this.totalAsignado   = 0;
    this.saldoRestante   = this.selectedOrder.totalPrice;
  }

  updateAmount(accountId: number, event: any) {
    const val = parseFloat(event.target.value) || 0;
    this.selectedAmounts[accountId] = val;
    this.totalAsignado = Object.values(this.selectedAmounts)
      .reduce((sum, x) => sum + x, 0);
    this.saldoRestante = this.selectedOrder.totalPrice - this.totalAsignado;
  }

  guardarAsignacion() {
    if (this.totalAsignado !== this.selectedOrder.totalPrice) {
      alert(`Total asignado (${this.totalAsignado}) no coincide con ${this.selectedOrder.totalPrice}`);
      return;
    }
    const firstId   = this.selectedAccountIds[0];
    const cuenta    = this.cuentasDisponibles.find(c => c.id === firstId);
    const nameAcct  = cuenta?.name ?? '';

    const dto: SaleP2PDto = {
      numberOrder:           this.selectedOrder.orderNumber,
      date:                  new Date(this.selectedOrder.createTime),
      taxType:               '4X',
      pesosCop:              this.selectedOrder.totalPrice,
      commission:             this.selectedOrder.commission,
      accountCopIds:         this.selectedAccountIds,
      accountAmounts:        this.selectedAmounts,
      nameAccount:           nameAcct,
      nameAccountBinance:    this.selectedOrder.binanceAccount ?? ''
    };

    this.saleService.createSale(dto).subscribe({
      next: () => {
        this.displayDialog = false;
        this.loadOrders();  // vuelve a traer sólo las nuevas
        alert('Venta P2P asignada correctamente');
      },
      error: err => {
        console.error('Error asignando venta P2P', err);
        alert('Error al asignar la venta');
      }
    });
  }

  getAccountName(id: number): string {
    return this.cuentasDisponibles.find(c => c.id === id)?.name ?? '';
  }


  filterByDate() {
    if (!this.startDate || !this.endDate) return;
    this.orderService.getOrdersByDateRangeAllAccounts(this.startDate, this.endDate)
      .subscribe(data => this.p2pOrders = data);
  }
  
  clearFilter() {
    this.startDate = this.endDate = null;
    this.loadOrders();
  }
}
