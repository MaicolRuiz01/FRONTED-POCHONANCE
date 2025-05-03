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
  selectedAccountIds: number[]   = []; // Ahora es un array de números
  selectedAmounts: { [key:number]: number } = {}; // Usamos números como claves
  totalAsignado     = 0;
  saldoRestante     = 0;

  startDate: Date | null = null;
  endDate:   Date | null = null;

  // Condición modal
  modoAsignacion: 'cuentas' | 's4' = 'cuentas';
  cuentaS4: string = ''; // Campo para ingresar la cuenta manualmente
  cuentaS4Confirmada: boolean = false; // Controla si la cuenta manual ha sido confirmada

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
    this.modoAsignacion     = 'cuentas'; // Reiniciar al abrir
    this.displayDialog      = true;
    this.cuentaS4Confirmada = false; // Resetear confirmación al abrir el modal
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

  // Método para confirmar la cuenta ingresada manualmente en el campo "S4"
  confirmarCuentaS4() {
    if (this.cuentaS4) {
      // Intentamos convertir 'cuentaS4' a número usando el operador `+`.
      const cuentaId = +this.cuentaS4; // Convierte a número, o NaN si no es válido

      if (!isNaN(cuentaId)) { // Verificamos que 'cuentaId' sea un número válido
        // Si es válido, agregamos 'cuentaId' al array 'selectedAccountIds'
        this.selectedAccountIds.push(cuentaId);
        this.selectedAmounts[cuentaId] = 0; // Inicializamos el valor para esa cuenta
        this.saldoRestante = this.selectedOrder.totalPrice; // Restablecer saldo restante
        this.cuentaS4Confirmada = true; // Marca que la cuenta ha sido confirmada
      } else {
        alert('Cuenta ingresada no válida. Debe ser un número.');
      }
    }
  }




  guardarAsignacion() {
    if (this.totalAsignado !== this.selectedOrder.totalPrice) {
      alert(`Total asignado (${this.totalAsignado}) no coincide con ${this.selectedOrder.totalPrice}`);
      return;
    }

    const dto: SaleP2PDto = {
      numberOrder:           this.selectedOrder.orderNumber,
      date:                  new Date(this.selectedOrder.createTime),
      taxType:               '4X',
      pesosCop:              this.selectedOrder.totalPrice,
      commission:             this.selectedOrder.commission,
      accountCopIds:         this.selectedAccountIds,
      accountAmounts:        this.selectedAmounts,
      nameAccount:           this.cuentaS4Confirmada ? this.cuentaS4 : '', // Solo asignar cuentaS4 si fue confirmada
      nameAccountBinance:    this.selectedOrder.binanceAccount ?? ''
    };

    this.saleService.createSale(dto).subscribe({
      next: () => {
        this.displayDialog = false;
        this.loadOrders();  // Vuelve a traer solo las nuevas
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
