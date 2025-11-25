import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { OrdenesCriptoService, OrdenSpotDTO } from '../../../../core/services/ordenes-cripto.service';
import { AccountBinance, AccountBinanceService } from '../../../../core/services/account-binance.service';
import { CryptoAverageRateService } from '../../../../core/services/crypto-average-rate.service';
import { forkJoin, finalize } from 'rxjs';

@Component({
  selector: 'app-ordenes-cripto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule,
    DialogModule
  ],
  templateUrl: './ordenes-cripto.component.html',
  styleUrls: ['./ordenes-cripto.component.css']
})
export class OrdenesCriptoComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  loadingTable = false;   // carga del listado
  importing = false;   // spinner pequeño de importación en 2º plano

  ordenes: OrdenSpotDTO[] = [];
  filtroCuenta = '';      // se manda al backend
  filtroGlobal = '';      // filtro frontend

  cuentas: AccountBinance[] = [];
  limiteImport = 50;

  mostrarModalTasaCripto = false;
  criptoSeleccionada: string | null = null;
  tasaInicialCripto: number | null = null;
  isTasaInicialCriptoInvalid = false;
  loadingTasaCripto = false;
  pendientes: {
    cripto: string;
    saldoActualCripto: number;
    tasaInicial?: number;
    invalida?: boolean;
  }[] = [];
  mostrarDialogPendientes = false;
  procesandoPendientes = false;


  constructor(
    private ordenesSrv: OrdenesCriptoService,
    private cuentasSrv: AccountBinanceService,
    private cryptoRateSrv: CryptoAverageRateService
  ) { }

  ngOnInit(): void {
  this.listar();

  // SOLO PARA PROBAR: comentar esto
  // this.refrescar();

  // y llamar manualmente:
  this.mostrarDialogPendientes = true;
  this.pendientes = [{
    cripto: 'TRX',
    saldoActualCripto: 6577.6158,
    tasaInicial: undefined,
    invalida: false
  }];
}


  /** Solo lista (no importa). */
  listar(): void {
    this.loadingTable = true;
    this.ordenesSrv.listar(this.filtroCuenta || undefined)
      .pipe(finalize(() => (this.loadingTable = false)))
      .subscribe({
        next: (data) => (this.ordenes = data.map(d => this.adapt(d))),
        error: () => (this.ordenes = [])
      });
  }

  /** Importa TODO en 2º plano y luego refresca la tabla, sin bloquearla. */
  importarEnSegundoPlano(): void {
    this.importing = true;
    this.ordenesSrv.importarTodas(this.limiteImport)
      .pipe(finalize(() => (this.importing = false)))
      .subscribe({
        next: () => this.listar(),
        error: () => {
          // si falla, no rompemos la UI; mantenemos lo ya listado
        }
      });
  }

  /** Re-importar (2º plano) + refrescar cuando termine. */
  refrescar(): void {
  this.cryptoRateSrv.getPendientes().subscribe({
    next: (lista) => {
      console.log('👉 Pendientes recibidos del backend:', lista); // DEBUG

      if (!lista || lista.length === 0) {
        this.importarEnSegundoPlano();
      } else {
        this.pendientes = lista.map(p => ({
          cripto: p.cripto,
          saldoActualCripto: p.saldoActualCripto,
          tasaInicial: undefined,
          invalida: false
        }));
        this.mostrarDialogPendientes = true;
      }
    },
    error: err => {
      console.error('Error cargando criptos pendientes', err);
      alert('No se pudo verificar las tasas iniciales. Intenta de nuevo.');
    }
  });
}


  puedeGuardarPendientes(): boolean {
    if (!this.pendientes || this.pendientes.length === 0) return false;
    return this.pendientes.every(p => p.tasaInicial != null && p.tasaInicial > 0);
  }

  cancelarPendientes(): void {
    this.mostrarDialogPendientes = false;
    this.pendientes = [];
  }

  guardarPendientesYImportar(): void {
    // validar
    let ok = true;
    for (const p of this.pendientes) {
      p.invalida = !p.tasaInicial || p.tasaInicial <= 0;
      if (p.invalida) ok = false;
    }
    if (!ok) return;

    this.procesandoPendientes = true;

    const peticiones = this.pendientes.map(p =>
      this.cryptoRateSrv.inicializarCripto(p.cripto, p.tasaInicial!)
    );

    forkJoin(peticiones)
      .pipe(finalize(() => (this.procesandoPendientes = false)))
      .subscribe({
        next: () => {
          this.mostrarDialogPendientes = false;
          this.pendientes = [];
          // 👇 ahora sí, importar órdenes
          this.importing = true;
          this.importarEnSegundoPlano();
        },
        error: err => {
          console.error('Error guardando tasas iniciales', err);
          alert('Ocurrió un error guardando las tasas iniciales. Revisa e intenta de nuevo.');
        }
      });
  }



  /** Re-lista por cuenta (sin re-importar). */
  buscarPorCuenta(): void {
    this.listar();
  }

  onGlobalFilter(ev: Event) {
    const value = (ev.target as HTMLInputElement)?.value ?? '';
    this.dt?.filterGlobal(value, 'contains');
  }

  tagSeverity(lado: string) {
    if (!lado) return 'info';
    return lado.toUpperCase() === 'BUY' ? 'success' : 'danger';
  }

  // Adaptador defensivo por si cambian nombres en el backend
  private adapt(d: any): OrdenSpotDTO {
    const num = (v: any) => (v == null ? 0 : typeof v === 'string' ? parseFloat(v) : Number(v));
    return {
      id: d.id ?? d.ID ?? 0,
      idOrden: d.idOrden ?? d.orderId ?? 0,
      cuenta: d.cuenta ?? d.accountName ?? d.account ?? '',
      simbolo: d.simbolo ?? d.symbol ?? '',
      lado: d.lado ?? d.side ?? '',
      estado: d.estado ?? d.status ?? '',
      precio: num(d.precio ?? d.price ?? d.avgPrice),
      cantidadBase: num(d.cantidadBase ?? d.baseQty ?? d.executedBaseQty),
      cantidadQuote: num(d.cantidadQuote ?? d.quoteQty ?? d.executedQuoteQty),
      comisionUsdt: num(d.comisionUsdt ?? d.commission ?? d.feeTotalUsdt),
      fecha: d.fecha ?? d.time ?? d.filledAt ?? null
    };
  }

  // ==================== LÓGICA TASA CRIPTO ====================

  /** Extrae la cripto base desde el símbolo del par (ej: TRXUSDT -> TRX) */
  private obtenerCriptoBase(simboloPar: string): string {
    if (!simboloPar) return '';
    const up = simboloPar.toUpperCase();
    if (up.endsWith('USDT')) return up.replace('USDT', '');
    if (up.endsWith('USDC')) return up.replace('USDC', '');
    return up;
  }

  /** Click en el botón de la fila para configurar tasa cripto */
  configurarTasaDesdeFila(simboloPar: string): void {
    const cripto = this.obtenerCriptoBase(simboloPar);
    if (!cripto) return;

    // 1) Consultar si ya hay tasa para esa cripto
    this.cryptoRateSrv.getUltimaPorCripto(cripto).subscribe({
      next: (rate) => {
        if (rate) {
          // Ya existe -> solo aviso, no vuelvo a pedir inicialización
          alert(`Ya hay una tasa promedio configurada para ${cripto}: ${rate.tasaPromedioDia}`);
        } else {
          // No existe -> abrir modal para que el usuario la ponga
          this.criptoSeleccionada = cripto;
          this.tasaInicialCripto = null;
          this.isTasaInicialCriptoInvalid = false;
          this.mostrarModalTasaCripto = true;
        }
      },
      error: err => {
        console.error('Error consultando tasa por cripto', err);
        alert('Error consultando la tasa promedio de la cripto');
      }
    });
  }

  validarTasaInicialCripto(): void {
    this.isTasaInicialCriptoInvalid =
      this.tasaInicialCripto == null || this.tasaInicialCripto <= 0;
  }

  guardarTasaInicialCripto(): void {
    if (!this.criptoSeleccionada || this.tasaInicialCripto == null) {
      return;
    }
    this.validarTasaInicialCripto();
    if (this.isTasaInicialCriptoInvalid) return;

    this.loadingTasaCripto = true;
    this.cryptoRateSrv.inicializarCripto(this.criptoSeleccionada, this.tasaInicialCripto)
      .pipe(finalize(() => (this.loadingTasaCripto = false)))
      .subscribe({
        next: (rate) => {
          console.log('Tasa inicial cripto guardada', rate);
          alert(`Tasa inicial para ${this.criptoSeleccionada} guardada: ${rate.tasaPromedioDia}`);
          this.mostrarModalTasaCripto = false;
          this.criptoSeleccionada = null;
          this.tasaInicialCripto = null;
        },
        error: err => {
          console.error('Error guardando tasa inicial cripto', err);
          const msg = err.error?.message || err.statusText || 'Error desconocido';
          alert('Error guardando tasa inicial de la cripto: ' + msg);
        }
      });
  }

  cancelarTasaCripto(): void {
    this.mostrarModalTasaCripto = false;
    this.criptoSeleccionada = null;
    this.tasaInicialCripto = null;
  }
}
