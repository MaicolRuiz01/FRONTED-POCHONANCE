import { Component, OnInit } from '@angular/core';
import { SaleP2PService, SaleP2PDto } from '../../../../../core/services/sale-p2p.service';
import { AccountCopService, AccountCop } from '../../../../../core/services/account-cop.service';
import { AccountBinanceService, AccountBinance } from '../../../../../core/services/account-binance.service';
import { SupplierService, Supplier } from '../../../../../core/services/supplier.service';

import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton'; // Asegúrate de importar el módulo adecuado
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs/operators';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableColumn } from '../../../../../shared/mi-table/mi-table.component';
import { MiTableComponent } from '../../../../../shared/mi-table/mi-table.component';
import { CardListComponent } from '../../../../../shared/mi-card/mi-card.component';

type BankType = 'NEQUI' | 'DAVIPLATA' | 'BANCOLOMBIA';


@Component({
  selector: 'app-asignaciones-ventap2p',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    MultiSelectModule,
    RadioButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    MiTableComponent,
    CardListComponent
  ],
  templateUrl: './asignaciones-ventap2p.component.html',
  styleUrls: ['./asignaciones-ventap2p.component.css']
})
export class AsignacionesVentap2pComponent implements OnInit {
  todaySales: SaleP2PDto[] = [];
  allAccountsp2p: SaleP2PDto[] = [];
  binanceAccounts: AccountBinance[] = [];
  selectedBinanceAccount: AccountBinance | null = null;
  cuentasDisponibles: AccountCop[] = [];
  selectedSale: SaleP2PDto | null = null;
  externalAmount: number = 0;
  saving = false;
  // Nuevo estado para la asignación
  isExternal: boolean = false;  // Si es externa o colombiana
  selectedAssignments: { account: AccountCop; amount: number }[] = [];
  displayAssignDialog: boolean = false;
  externalAccountName: string = '';
  noSalesMessage: string = '';
  loading: boolean = false;
  isMobile: boolean = false;
  selectedAccounts: AccountCop[] = [];
  selectedBank: string | null = null;

  cuentasTodas: AccountCop[] = [];      // todas las cuentas
  cuentasFiltradas: AccountCop[] = [];  // las que se ven en el multiselect

  bankOptions: { label: string; value: string }[] = [];
  selectedBankType: BankType | null = null;
  //componnete reutilizable de la tabla
  columns: TableColumn[] = [
    { campo: 'id', columna: 'N° de orden' },
    { campo: 'dateFmt', columna: 'Fecha' },
    { campo: 'dollarsUsFmt', columna: 'Dolares' },
    { campo: 'pesosCopFmt', columna: 'Pesos COP' },
    { campo: 'commissionFmt', columna: 'Comision' }
  ];



  constructor(
    private saleService: SaleP2PService,
    private accountBinanceService: AccountBinanceService,
    private accountCopService: AccountCopService,
    private supplierService: SupplierService
  ) { }

  ngOnInit(): void {
    this.loadNoAsignadas();
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }
  openAssignDialog(sale: SaleP2PDto): void {
  this.saving = false;
  this.selectedSale = sale;
  this.displayAssignDialog = true;

  this.selectedAssignments = [];
  this.selectedAccounts = [];

  // ✅ reset filtro por banco
  this.selectedBankType = null;

  this.loadCuentasCop();
}

  handleAssignType(): void {
    if (this.isExternal) {
      this.externalAccountName = '';
    } else {
      this.selectedAssignments = [];
    }
  }

  onAccountsChange(): void {
    const ventaCop = Number(this.selectedSale?.pesosCop ?? 0);

    // si hay 1 sola cuenta seleccionada => le ponemos TODO el valor de la venta
    // si hay varias => por defecto quedan en 0 (para que el usuario reparta)
    const defaultAmount = (this.selectedAccounts.length === 1) ? ventaCop : 0;

    this.selectedAssignments = this.selectedAccounts.map(account => {
      const existing = this.selectedAssignments.find(a => a.account.id === account.id);

      return {
        account,
        amount: existing ? existing.amount : defaultAmount
      };
    });
  }

  private loadCuentasCop(): void {
  this.accountCopService.getAll().subscribe({
    next: (cuentas) => {
      this.cuentasTodas = cuentas ?? [];
      this.applyBankFilter();
    },
    error: (err) => {
      console.error('Error cargando cuentas COP:', err);
      this.cuentasTodas = [];
      this.cuentasFiltradas = [];
    }
  });
}


  applyBankFilter(): void {
    this.cuentasFiltradas = !this.selectedBankType
      ? this.cuentasTodas
      : this.cuentasTodas.filter(c => (c.bankType ?? '').toUpperCase() === this.selectedBankType);

    // si el usuario ya había seleccionado cuentas, elimina las que ya no aplican
    const idsVisibles = new Set(this.cuentasFiltradas.map(c => c.id));
    this.selectedAccounts = (this.selectedAccounts ?? []).filter(c => idsVisibles.has(c.id));

    this.onAccountsChange();
  }


  assignAccounts(): void {
    if (this.saving) return;

    if (!this.selectedSale) {
      alert("Por favor selecciona una venta.");
      return;
    }

    if (!this.selectedAccounts || this.selectedAccounts.length === 0) {
      alert("Debes seleccionar al menos una cuenta COP.");
      return;
    }

    const hasInvalid = this.selectedAssignments.some(a => !a.amount || a.amount <= 0);
    if (hasInvalid) {
      alert("Todos los montos deben ser mayores a 0.");
      return;
    }

    const hasNullId = this.selectedAssignments.some(a => !a.account?.id);
    if (hasNullId) {
      alert("Hay una cuenta inválida seleccionada. Vuelve a seleccionar.");
      return;
    }

    const total = this.selectedAssignments.reduce((sum, a) => sum + (a.amount || 0), 0);
    const ventaCop = Number(this.selectedSale.pesosCop ?? 0);

    if (total > ventaCop) {
      alert("El total asignado excede el monto de la venta.");
      return;
    }

    const accounts = this.selectedAssignments.map(a => ({
      amount: a.amount,
      nameAccount: a.account.name,
      accountCop: a.account.id
    }));

    this.submitAssignRequest(accounts);
  }



  // Función para enviar los datos al backend
  submitAssignRequest(accounts: any): void {
    if (!this.selectedSale) return;

    if (this.saving) return;      // ✅ evita doble click
    this.saving = true;           // ✅ bloquea UI

    this.saleService.assignAccounts(this.selectedSale.id, accounts)
      .pipe(finalize(() => {
        this.saving = false;       // ✅ se libera SIEMPRE
      }))
      .subscribe({
        next: () => {
          alert('Cuentas asignadas exitosamente.');
          this.displayAssignDialog = false;
          this.resetAssignForm();
          this.loadNoAsignadas();
        },
        error: (err) => {
          console.error(err);
          alert('Error al asignar las cuentas');
        }
      });
  }



  loadNoAsignadas(): void {
    this.loading = true;

    const req$ = this.selectedBinanceAccount
      ? this.saleService.getTodayNoAsignadas(this.selectedBinanceAccount.name)
      : this.saleService.getTodayNoAsignadasAllAccounts();

    req$.subscribe({
      next: (sales) => {
        const sorted = (sales ?? []).slice().sort((a, b) => {
          return new Date(a.date as any).getTime() - new Date(b.date as any).getTime(); // ✅ ASC: viejas primero
        });


        const fmtCop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
        const fmtUsd = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const fmtDateFull = new Intl.DateTimeFormat('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        const fmtTimeOnly = new Intl.DateTimeFormat('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        const today = new Date();
        const isSameDay = (a: Date, b: Date) =>
          a.getFullYear() === b.getFullYear() &&
          a.getMonth() === b.getMonth() &&
          a.getDate() === b.getDate();

        this.allAccountsp2p = sorted.map(s => {
          const d = new Date(s.date as any);

          return {
            ...s,
            dateFmt: isSameDay(d, today) ? fmtTimeOnly.format(d) : fmtDateFull.format(d),
            pesosCopFmt: fmtCop.format(Number(s.pesosCop ?? 0)),
            dollarsUsFmt: fmtUsd.format(Number(s.dollarsUs ?? 0)),
            commissionFmt: fmtUsd.format(Number(s.commission ?? 0)),
          };
        }) as any;

        this.loading = false;
      },

      error: () => (this.loading = false),
    });
  }
  
  private resetAssignForm(): void {
    this.selectedSale = null;
    this.selectedAssignments = [];
    this.selectedAccounts = [];
    this.selectedBank = null;
  }
  bankLogo(type?: string | null): string {
    const t = (type ?? '').toString().trim().toUpperCase();

    switch (t as BankType) {
      case 'NEQUI': return '/assets/layout/images/nequi.png';
      case 'DAVIPLATA': return '/assets/layout/images/daviplata.png';
      case 'BANCOLOMBIA': return '/assets/layout/images/bancolombia.png';
      default: return '/assets/layout/images/nequi.png';
    }
  }
  setBankFilter(type: BankType | null) {
    // toggle: si vuelve a tocar el mismo logo, quita el filtro
    this.selectedBankType = (this.selectedBankType === type) ? null : type;
    this.applyBankFilter();
  }
}
