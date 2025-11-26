import { Component, OnInit } from '@angular/core';
import { AccountBinanceService, AccountBinance, CryptoBalanceDetail } from '../../../../core/services/account-binance.service';
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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CryptoAverageRateService, CryptoAverageRateDto } from '../../../../core/services/crypto-average-rate.service';
import { AverageRateDto, AverageRateService } from '../../../../core/services/average-rate.service';
import { finalize, switchMap } from 'rxjs/operators';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

export interface DisplayAccount {
  id?: number;
  accountType: string;
  saldoInterno: number;
  saldoExterno?: number;
  correo?: string;
  address?: string;
  isFlipped: boolean;
  syncing: boolean;
  balances?: CryptoBalanceDetail[];
  loadingBalances?: boolean;
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
    ConfirmDialogModule,
    ProgressSpinnerModule
  ]
})
export class SaldosComponent implements OnInit {
  totalBalanceUsd = 0;
  totalBalanceCop = 0;
  latestRate = 0;
  balanceTotalExterno = 0;
  balanceTotalExternoCop = 0;
  tasasCriptoHoy: CryptoAverageRateDto[] = [];
  createAccountDialog = false;
  modalVisible = false;
  editMode = false;
  selectedAccountId: number | null = null;
  loading: boolean = true;
  selectAccountTypeDialog: boolean = false;
  selectedAccountType: string | null = null;
  noAverageRate: boolean = false;

  tiposCuenta = [
    { label: 'BINANCE', value: 'BINANCE' },
    { label: 'TRUST', value: 'TRUST' },
    { label: 'SOLANA', value: 'SOLANA' }
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

  syncingAll = false;

  constructor(
    private accountService: AccountBinanceService,
    private cajaService: AccountCopService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private http: HttpClient,
    private balanceService: BalanceService,
    private cryptoRateService: CryptoAverageRateService,
    private averageRateService: AverageRateService
  ) { }

  ngOnInit() {
    this.loadAccounts();
    this.getTotalBalance();
    this.getBalanceTotalInterno();
    this.getBalanceTotalExterno();
    this.loadCryptoRatesToday();
    this.loadAverageRate();
  }


  getTotalBalance() {
    this.accountService.getTotalBalance().subscribe({
      next: res => this.totalBalanceCop = res,
      error: err => console.error('Error obteniendo saldo total:', err)
    });
  }

  loadCryptoRatesToday(): void {
    this.cryptoRateService.getTasasDelDia().subscribe({
      next: (data: CryptoAverageRateDto[]) => {
        this.tasasCriptoHoy = data || [];
      },
      error: (e: any) => {
        console.error('Error cargando tasas cripto del día', e);
        this.tasasCriptoHoy = [];
      }
    });
  }


  getBalanceTotalExterno() {
    this.accountService.getBalanceTotalExterno().subscribe({
      next: res => {
        this.balanceTotalExterno = res;
        this.recalculateExternalCop();      // 👈 recalcular COP
      },
      error: err => console.error('Error obteniendo saldo total externo:', err)
    });
  }


  getBalanceTotalInterno() {
    this.accountService.getBalanceTotalInterno().subscribe({
      next: res => this.totalBalanceUsd = res,
      error: err => console.error('Error obteniendo saldo total interno:', err)
    });
  }

  loadAccounts() {
    this.loading = true;  // 👈 empieza la carga

    this.accountService.traerCuentas().subscribe({
      next: res => {
        this.accounts = res.map(c => ({
          id: c.id,
          accountType: c.name,
          saldoInterno: c.balance,
          correo: c.correo || '–',
          address: c.address || '–',
          isFlipped: false,
          saldoExterno: 0,
          syncing: false,
          loadingBalances: false,
          balances: []
        }));


        // cargar saldo externo automáticamente
        this.accounts.forEach(acc => {
          this.cargarSaldoExternoInicial(acc);
          this.cargarCriptosInicial(acc);   // 👈 NUEVO
        });


        this.loading = false; // 👈 ya terminó
      },
      error: err => {
        console.error(err);
        this.loading = false; // 👈 aunque falle, quita el spinner
      }
    });
  }

  private cargarSaldoExternoInicial(account: DisplayAccount): void {
    this.accountService.getUSDTBalanceBinance(account.accountType)
      .subscribe({
        next: saldo => {
          account.saldoExterno = parseFloat(saldo) || 0;
        },
        error: _ => {
          console.error(`No se pudo obtener el saldo externo de ${account.accountType}`);
          // Si quieres, aquí NO mostramos toast para no spamear, solo error en consola.
        }
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

  openCreateAccountDialog() {
    this.resetForm();
    this.editMode = false;
    this.selectedAccountId = null;
    this.selectAccountTypeDialog = true; // abre el diálogo de selección
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

  loadAverageRate() {
    this.averageRateService.getUltimaTasa().subscribe({
      next: (res) => {
        if (!res) {
          this.noAverageRate = true;
          this.latestRate = 0;
        } else {
          this.noAverageRate = false;
          this.latestRate = res.averageRate;
        }

        this.recalculateExternalCop();
      },
      error: (err) => {
        console.error('Error obteniendo tasa promedio:', err);
        this.noAverageRate = true;
        this.latestRate = 0;
        this.recalculateExternalCop();
      }
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
  syncInternalAccount(account: DisplayAccount, event: Event) {
    event.stopPropagation();             // evita voltear la card al hacer click
    account.syncing = true;

    this.accountService.syncInternalByName(account.accountType)
      .pipe(finalize(() => account.syncing = false))
      .subscribe({
        next: (snapshot) => {
          // Mensaje con resumen del snapshot
          const resumen = Object.entries(snapshot)
            .map(([k, v]) => `${k}: ${(v ?? 0).toFixed(2)}`)
            .join(', ');
          this.messageService.add({
            severity: 'success',
            summary: 'Sincronizado',
            detail: resumen || `Saldos actualizados para ${account.accountType}`
          });

          // refresca tarjetas y totales internos
          this.loadAccounts();
          this.getBalanceTotalInterno();
          this.getTotalBalance();
        },
        error: _ => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `No se pudo sincronizar ${account.accountType}`
          });
        }
      });
  }
  private recalculateExternalCop(): void {
    this.balanceTotalExternoCop = (this.balanceTotalExterno || 0) * (this.latestRate || 0);
  }

  private cargarCriptosInicial(account: DisplayAccount): void {
    account.loadingBalances = true;

    this.accountService.syncInternalByName(account.accountType)
      .pipe(
        switchMap(() =>
          this.accountService.getInternalBalances(account.accountType)
        ),
        finalize(() => account.loadingBalances = false)
      )
      .subscribe({
        next: (balances) => {
          account.balances = balances || [];
        },
        error: _ => {
          console.error(`No se pudieron cargar las criptos de ${account.accountType}`);
          account.balances = [];
        }
      });
  }


}
