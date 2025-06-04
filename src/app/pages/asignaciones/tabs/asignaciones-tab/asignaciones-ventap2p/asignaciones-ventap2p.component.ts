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
import { TooltipModule } from 'primeng/tooltip';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DropdownModule } from 'primeng/dropdown';
import { AccountBinance, AccountBinanceService } from '../../../../../core/services/account-binance.service';

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
    InputNumberModule,
    OverlayPanelModule,
    TooltipModule,
    DropdownModule
  ],
  templateUrl: './asignaciones-ventap2p.component.html',
  styleUrls: ['./asignaciones-ventap2p.component.css']
})
export class AsignacionesVentap2pComponent implements OnInit {
  p2pOrders: OrderP2PDto[] = [];
  todaySales: SaleP2PDto[] = [];
  cuentasDisponibles: AccountCop[] = [];
  binanceAccounts: AccountBinance[] = [];
  selectedBinanceAccount: AccountBinance | null = null;

  displayDialog = false;
  selectedOrder!: OrderP2PDto;
  selectedAccountIds: number[] = [];
  selectedAmounts: { [key:number]: number } = {};
  totalAsignado = 0;
  saldoRestante = 0;

  startDate: Date | null = null;
  endDate: Date | null = null;
  autoAssignEnabled: boolean = true;
  loading: boolean = false;
  loadingTodaySales: boolean = false;


  //s4 logica
  s4Reference: string = '';
  showS4Input: boolean = false;

  constructor(
    private orderService: OrderP2PService,
    private saleService: SaleP2PService,
    private accountCopService: AccountCopService,
    private accountBinanceService: AccountBinanceService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.setDefaultDates();
  }

  private setDefaultDates(): void {
    const today = new Date();
    this.startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Primer día del mes
    this.endDate = today;
  }

  private loadInitialData(): void {
    this.loading = true;

    // Cargar cuentas Binance
    this.accountBinanceService.traerCuentas().subscribe({
      next: (accounts) => {
        this.binanceAccounts = accounts;
        // Cargar cuentas COP
        this.accountCopService.getAll().subscribe({
          next: (copAccounts) => {
            this.cuentasDisponibles = copAccounts;
            this.loading = false;
          },
          error: () => {
            this.cuentasDisponibles = [];
            this.loading = false;
          }
        });
      },
      error: () => {
        this.binanceAccounts = [];
        this.loading = false;
      }
    });
  }

  onBinanceAccountChange(): void {
    if (this.selectedBinanceAccount) {
      this.loadTodaySales();
      // También podríamos cargar automáticamente las órdenes del rango de fechas por defecto
      this.filterOrders();
    } else {
      this.todaySales = [];
      this.p2pOrders = [];
    }
  }

  loadTodaySales(): void {
    if (!this.selectedBinanceAccount) return;

    this.loadingTodaySales = true;
    this.orderService.getTodaySales(this.selectedBinanceAccount.name).subscribe({
      next: (sales) => {
        this.todaySales = sales;
        this.loadingTodaySales = false;
      },
      error: (error) => {
        console.error('Error al cargar ventas del día:', error);
        this.todaySales = [];
        this.loadingTodaySales = false;
      }
    });
  }

  isFilterValid(): boolean {
    return !!this.selectedBinanceAccount && !!this.startDate && !!this.endDate;
  }

  filterOrders(): void {
    if (!this.isFilterValid()) return;

    this.loading = true;
    const accountName = this.selectedBinanceAccount!.name;

    this.orderService.getOrdersByDateRange(
      accountName,
      this.startDate!,
      this.endDate!
    ).subscribe({
      next: (data) => {
        this.p2pOrders = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al filtrar órdenes:', error);
        this.p2pOrders = [];
        this.loading = false;
      }
    });
  }

  clearFilter(): void {
    this.selectedBinanceAccount = null;
    this.startDate = this.endDate = null;
    this.p2pOrders = [];
    this.todaySales = [];
  }

  abrirAsignacion(order: OrderP2PDto): void {
    this.selectedOrder = order;
    this.selectedAccountIds = [];
    this.selectedAmounts = {};
    this.totalAsignado = 0;
    this.saldoRestante = order.totalPrice;
    this.displayDialog = true;
  }

  updateAmount(accountId: number, event: any): void {
    const val = event.value || 0;
    this.selectedAmounts[accountId] = val;

    if (this.autoAssignEnabled && this.selectedAccountIds.length === 2) {
      const otherAccountId = this.selectedAccountIds.find(id => id !== accountId);
      if (otherAccountId !== undefined) {
        const remaining = this.selectedOrder.totalPrice - val;
        this.selectedAmounts[otherAccountId] = remaining > 0 ? remaining : 0;
      }
    }

    this.calculateTotals();
  }

  private calculateTotals(): void {
    this.totalAsignado = Object.values(this.selectedAmounts)
      .reduce((sum, x) => sum + x, 0);
    this.saldoRestante = this.selectedOrder.totalPrice - this.totalAsignado;
  }

  onAccountSelectionChange(): void {
    this.selectedAmounts = {};
    this.totalAsignado = 0;
    this.saldoRestante = this.selectedOrder.totalPrice;
    this.s4Reference = '';

    // Verificar si se seleccionó la cuenta S4
    this.showS4Input = this.selectedAccountIds.some(id =>
      this.getAccountName(id).toUpperCase().includes('S4')
    );

    if (this.selectedAccountIds.length === 2) {
      this.selectedAccountIds.forEach(id => {
        this.selectedAmounts[id] = 0;
      });
    }
  }

  guardarAsignacion(): void {
    if (this.totalAsignado !== this.selectedOrder.totalPrice) {
      alert(`Total asignado (${this.totalAsignado}) no coincide con ${this.selectedOrder.totalPrice}`);
      return;
    }

    const firstId = this.selectedAccountIds[0];
    const cuenta = this.cuentasDisponibles.find(c => c.id === firstId);
    const nameAcct = cuenta?.name ?? '';

    const dto: SaleP2PDto = {
      numberOrder: this.selectedOrder.orderNumber,
      date: new Date(this.selectedOrder.createTime),
      taxType: '4X',
      pesosCop: this.selectedOrder.totalPrice,
      commission: this.selectedOrder.commission,
      accountCopIds: this.selectedAccountIds,
      accountAmounts: this.selectedAmounts,
      nameAccount: nameAcct,
      nameAccountBinance: this.selectedOrder.binanceAccount ?? '',
      dollarsUs: this.selectedOrder.amount
    };

    this.saleService.createSale(dto).subscribe({
      next: () => {
        this.displayDialog = false;
        alert('Venta P2P asignada correctamente');
        // Actualizar la lista de ventas del día
        this.loadTodaySales();
      },
      error: (err) => {
        console.error('Error asignando venta P2P', err);
        alert('Error al asignar la venta');
      }
    });
  }

  getAccountName(id: number): string {
    return this.cuentasDisponibles.find(c => c.id === id)?.name ?? '';
  }
}
