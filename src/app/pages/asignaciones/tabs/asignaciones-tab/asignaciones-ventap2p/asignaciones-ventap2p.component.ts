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
import { InputNumberModule } from 'primeng/inputnumber';

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
    CalendarModule,
    InputNumberModule
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

  autoAssignEnabled: boolean = true;

  constructor(
    private orderService: OrderP2PService,
    private saleService: SaleP2PService,
    private accountCopService: AccountCopService
  ) {}


   private staticOrders: OrderP2PDto[] = [
    {
      orderNumber: 'ORD001',
      tradeType: 'BUY',
      amount: 100,
      totalPrice: 500000,
      unitPrice: 5000,
      orderStatus: 'COMPLETED',
      createTime: new Date().toISOString(),
      commission: 10000,
      counterPartNickName: 'Cliente1',
      payMethodName: 'Transferencia',
      nameAccount: 'Cuenta A',
      accountAmount: 100,
      binanceAccount: 'Binance-1'
    },
    {
      orderNumber: 'ORD002',
      tradeType: 'SELL',
      amount: 50,
      totalPrice: 250000,
      unitPrice: 5000,
      orderStatus: 'PENDING',
      createTime: new Date().toISOString(),
      commission: 5000,
      counterPartNickName: 'Cliente2',
      payMethodName: 'Efectivo',
      nameAccount: 'Cuenta B',
      accountAmount: 50,
      binanceAccount: 'Binance-2'
    }
  ];

  private staticCuentas: AccountCop[] = [
    { id: 1, name: 'Cuenta A', balance: 57854 },
    { id: 2, name: 'Cuenta B', balance: 81023 },
  ];
  ngOnInit(): void {

    this.p2pOrders = this.staticOrders;
    this.cuentasDisponibles = this.staticCuentas;

    this.loadOrders();
    this.loadCuentas();
  }

  private loadOrders(): void {
    this.orderService.getAllOrders()
      .subscribe({
        next: data => {
          this.p2pOrders = (data && data.length > 0) ? data : this.staticOrders;
        },
        error: () => {
          // En caso de error usar datos estáticos
          this.p2pOrders = this.staticOrders;
        }
      });
  }

  private loadCuentas(): void {
    this.accountCopService.getAll()
      .subscribe({
        next: c => {
          this.cuentasDisponibles = (c && c.length > 0) ? c : this.staticCuentas;
        },
        error: () => {
          this.cuentasDisponibles = this.staticCuentas;
        }
      });
  }






  abrirAsignacion(order: OrderP2PDto) {
    this.selectedOrder      = order;
    this.selectedAccountIds = [];
    this.selectedAmounts    = {};
    this.totalAsignado      = 0;
    this.saldoRestante      = order.totalPrice;
    this.displayDialog      = true;
  }

updateAmount(accountId: number, event: any) {
  const val = event.value || 0;
  this.selectedAmounts[accountId] = val;

  // Lógica para asignación automática cuando hay 2 cuentas y está habilitado
  if (this.autoAssignEnabled && this.selectedAccountIds.length === 2) {
    const otherAccountId = this.selectedAccountIds.find(id => id !== accountId);
    if (otherAccountId !== undefined) {
      const remaining = this.selectedOrder.totalPrice - val;
      this.selectedAmounts[otherAccountId] = remaining > 0 ? remaining : 0;
    }
  }

  // Actualizar totales
  this.totalAsignado = Object.values(this.selectedAmounts)
    .reduce((sum, x) => sum + x, 0);
  this.saldoRestante = this.selectedOrder.totalPrice - this.totalAsignado;
}

onAccountSelectionChange() {
  this.selectedAmounts = {};
  this.totalAsignado = 0;
  this.saldoRestante = this.selectedOrder.totalPrice;

  // Inicializar valores cuando hay 2 cuentas
  if (this.selectedAccountIds.length === 2) {
    this.selectedAccountIds.forEach(id => {
      this.selectedAmounts[id] = 0;
    });
  }
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
      nameAccountBinance:    this.selectedOrder.binanceAccount ?? '',
      dollarsUs: this.selectedOrder.amount
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
