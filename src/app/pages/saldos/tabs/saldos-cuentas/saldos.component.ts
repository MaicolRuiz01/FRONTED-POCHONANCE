import { Component, OnInit } from '@angular/core';
import { AccountBinanceService, AccountBinance } from '../../../../core/services/account-binance.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { AccountCopService } from '../../../../core/services/account-cop.service';
import { BalanceService } from '../../../../core/services/balance.service';
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { finalize } from 'rxjs/operators';


export interface DisplayAccount {
  id?: number;
  accountType: string;
  saldoInterno: number;
  saldoExterno?: number;
  correo?: string;
  address?: string;
  isFlipped: boolean;
}

@Component({
  selector: 'app-saldos',
  templateUrl: './saldos.component.html',
  standalone: true,
  styleUrls: ['./saldos.component.css'],
  providers: [MessageService, ConfirmationService],
  imports: [
    ToastModule,
    ToolbarModule,
    DialogModule,
    TableModule,
    FormsModule,
    CommonModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    ConfirmDialogModule
  ]
})
export class SaldosComponent implements OnInit {
  totalBalanceUsd = 0;
  totalBalanceCop = 0;
  latestRate = 0;
  balanceTotalExterno = 0;

  createAccountDialog = false;
  modalVisible = false;
  cajas: { id: number, name: string, saldo: number }[] = [];

  // NUEVO: modo edición y referencia al ID seleccionado
  editMode = false;
  selectedAccountId: number | null = null;

  tiposCuenta = [
    { label: 'BINANCE', value: 'BINANCE' },
    { label: 'TRUST', value: 'TRUST' },
    {label: 'SOLANA', value: 'SOLANA' }
  ];

  accounts: DisplayAccount[] = [];

  newAccount: AccountBinance = {
    // incluye id opcional si tu interfaz lo tiene en el service
    // id: undefined,
    name: '',
    referenceAccount: '',
    correo: '',
    userBinance: '',
    balance: 0,
    address: '',
    tipo: '',
    apiKey: '',
    apiSecret: ''
  };

  totalCajasCop: number = 0;
  syncingAll = false; 

  constructor(
    private accountService: AccountBinanceService,
    private cajaService: AccountCopService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private http: HttpClient,
    private balanceService: BalanceService
  ) { }

  ngOnInit() {
    this.loadAccounts();
    this.getTotalBalance();
    this.getLatestPurchaseRate();
    this.getBalanceTotalInterno();
    this.getBalanceTotalExterno();
    this.loadCajas();
    this.getTotalCajas();
  }

  // ---------- Totales ----------
  getTotalBalance() {
    this.accountService.getTotalBalance().subscribe({
      next: res => this.totalBalanceCop = res,
      error: err => console.error('Error obteniendo saldo total:', err)
    });
  }

  getBalanceTotalExterno() {
    this.accountService.getBalanceTotalExterno().subscribe({
      next: res => this.balanceTotalExterno = res,
      error: err => console.error('Error obteniendo saldo total externo:', err)
    });
  }

  getBalanceTotalInterno() {
    this.accountService.getBalanceTotalInterno().subscribe({
      next: res => this.totalBalanceUsd = res,
      error: err => console.error('Error obteniendo saldo total interno:', err)
    });
  }

  // ---------- Cajas ----------
  loadCajas() {
    this.cajaService.getAllCajas().subscribe({
      next: res => {
        this.cajas = res;
      },
      error: err => console.error('Error cargando cajas:', err)
    });
  }

  getTotalCajas() {
    this.balanceService.getTotalCajas().subscribe({
      next: res => this.totalCajasCop = res.total,
      error: err => console.error('Error obteniendo total de cajas:', err)
    });
  }

  // ---------- Cuentas ----------
  loadAccounts() {
    this.accountService.traerCuentas().subscribe({
      next: res => {
        this.accounts = res.map(c => ({
          id: c.id,
          accountType: c.name,
          saldoInterno: c.balance,
          correo: c.correo || '–',
          address: c.address || '–',
          isFlipped: false,
          saldoExterno: undefined // se consultará solo con botón
        }));
      },
      error: err => console.error(err)
    });
  }

  consultarSaldoExterno(account: DisplayAccount, event: Event) {
    event.stopPropagation(); // evita que se voltee la card
    this.accountService.getUSDTBalanceBinance(account.accountType)
      .subscribe({
        next: saldo => {
          account.saldoExterno = parseFloat(saldo) || 0;
        },
        error: _ => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `No se pudo obtener el saldo externo de ${account.accountType}`
          });
        }
      });
  }

  toggleText(account: DisplayAccount) {
    account.isFlipped = !account.isFlipped;
  }

  // ---------- Crear / Editar ----------
  openNew() {
    this.resetForm();
    this.editMode = false;
    this.selectedAccountId = null;
    this.createAccountDialog = true;
  }

  cancelarNuevaCuenta() {
    this.createAccountDialog = false;
  }

  // Mantengo tu método original de creación (lo usa guardarCuenta cuando no está en modo edición)
  crearCuentaBinance() {
    if (!this.newAccount.name || !this.newAccount.referenceAccount || !this.newAccount.tipo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Completa todos los campos'
      });
      return;
    }

    if (this.newAccount.tipo === 'TRUST') {
      this.newAccount.apiKey = null!;
      this.newAccount.apiSecret = null!;
    }

    this.accountService.crear(this.newAccount).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cuenta creada',
          detail: 'Se agregó la cuenta exitosamente'
        });
        this.createAccountDialog = false;
        this.loadAccounts();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la cuenta'
        });
      }
    });
  }

  // NUEVO: método único para guardar (crea o actualiza según editMode)
  guardarCuenta() {
    // Validaciones comunes
    if (!this.newAccount.name || !this.newAccount.referenceAccount || !this.newAccount.tipo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Completa todos los campos obligatorios'
      });
      return;
    }

    if (this.newAccount.tipo === 'TRUST') {
      this.newAccount.apiKey = null!;
      this.newAccount.apiSecret = null!;
    }

    if (this.editMode && this.selectedAccountId != null) {
      // UPDATE (PUT)
      // Aseguramos que el payload lleve el id si tu interfaz lo contempla
      (this.newAccount as any).id = this.selectedAccountId;

      this.accountService.updateAccount(this.selectedAccountId, this.newAccount).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizada',
            detail: 'Cuenta actualizada correctamente'
          });
          this.createAccountDialog = false;
          this.loadAccounts();
          this.resetForm();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la cuenta'
          });
        }
      });
    } else {
      // CREATE (POST)
      this.crearCuentaBinance();
    }
  }

  // Carga el formulario con datos completos para edición
  editarCuenta(account: DisplayAccount) {
    if (!account.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el ID de la cuenta'
      });
      return;
    }

    this.editMode = true;
    this.selectedAccountId = account.id;
    this.createAccountDialog = true; // abre primero; luego rellena

    // Trae la cuenta completa desde el backend para no pisar campos con null
    this.accountService.getById(account.id).subscribe({
      next: (full: AccountBinance) => {
        this.newAccount = {
          // si tu interfaz tiene id?: number, lo mantenemos en memoria
          ...(full as any)
        };
      },
      error: () => {
        // Fallback: al menos setea lo visible
        this.newAccount = {
          name: account.accountType,
          referenceAccount: '', // desconocido en la card
          correo: account.correo && account.correo !== '–' ? account.correo : '',
          userBinance: '',
          balance: account.saldoInterno,
          address: account.address && account.address !== '–' ? account.address : '',
          tipo: '',
          apiKey: '',
          apiSecret: ''
        };
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar todos los datos; revisa los campos antes de guardar.'
        });
      }
    });
  }

  // ---------- Eliminar ----------
  confirmDelete(account: DisplayAccount) {
    this.confirmationService.confirm({
      message: `¿Seguro que quieres eliminar la cuenta ${account.accountType}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (account.id) {
          this.deleteAccount(account.id);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se encontró el ID de la cuenta'
          });
        }
      }
    });
  }

  deleteAccount(id: number) {
    this.accountService.deleteAccount(id).subscribe({
      next: () => {
        this.accounts = this.accounts.filter(a => a.id !== id);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminada',
          detail: 'Cuenta eliminada correctamente'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la cuenta'
        });
      }
    });
  }

  // ---------- Util ----------
  private resetForm() {
    this.newAccount = {
      name: '',
      referenceAccount: '',
      correo: '',
      userBinance: '',
      balance: 0,
      address: '',
      tipo: '',
      apiKey: '',
      apiSecret: ''
    };
  }

  getLatestPurchaseRate() {
    this.accountService.getLatestPurchaseRate().subscribe({
      next: res => this.latestRate = res,
      error: err => console.error('Error obteniendo tasa de compra:', err)
    });
  }

  syncAllBalances() {
    this.syncingAll = true;
    this.accountService.syncAllInternal()
      .pipe(finalize(() => (this.syncingAll = false)))
      .subscribe({
        next: _ => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sincronizado',
            detail: 'Saldos internos actualizados desde el exchange.'
          });
          // refresca tarjetas y totales
          this.loadAccounts();
          this.getBalanceTotalInterno();
          this.getTotalBalance();
        },
        error: _ => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron sincronizar los saldos.'
          });
        }
      });
  }
}
