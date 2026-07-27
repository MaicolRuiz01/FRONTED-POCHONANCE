import { Component, OnInit  } from '@angular/core';
import { MovimientoService, MovimientoVistaDto } from '../../core/services/movimiento.service';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { Caja, CajaService } from '../../core/services/caja.service';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TraspasosService,TransaccionesDTO } from '../../core/services/traspasos.service';
import { OrdenesCriptoComponent } from './criptos/cripto-tab/ordenes-cripto.component';
import { TraspasosTabComponent } from '../asignaciones/tabs/traspasos-tab/traspasos-tab.component';
import { Movimiento } from '../../core/services/pago-proveedor.service';
import { AsignadasComponent } from './asignadas/asignadas.component';
import { NotificationService } from '../../core/services/notification.service';


@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    TabViewModule,
    TableModule,
    CommonModule,
    CurrencyPipe,
    DialogModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    InputTextModule,
    OrdenesCriptoComponent,
    TraspasosTabComponent,
    AsignadasComponent
],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.css'
})
export class MovimientosComponent implements OnInit {
  loading: boolean = true;
  retiros: MovimientoVistaDto[] = [];
  depositos: MovimientoVistaDto[] = [];
  transferencias: MovimientoVistaDto[] = [];
  traspasos: TransaccionesDTO[] = [];
  cargando: boolean = false;

  /** Lista unificada de todos los movimientos (retiros + depósitos + transferencias). */
  movimientos: MovimientoVistaDto[] = [];

  // ---- Filtros de la vista unificada ----
  filtroDesde: string = '';
  filtroHasta: string = '';
  filtroTipo: string = '';   // '', 'RETIRO', 'DEPOSITO', 'TRANSFERENCIA'
  filtroCuenta: string = ''; // coincide con cuentaOrigen o cuentaDestino
  filtroCaja: string = '';   // nombre/valor de caja

  cajas: Caja[] = [];
  displayCajaDialog: boolean = false;
  nuevaCaja: Partial<Caja> = { name: '', saldo: 0 };

  constructor(private movimientoService: MovimientoService,
    private cajaService: CajaService,
    private traspasosService: TraspasosService
  ,
    private notificationService: NotificationService
) {}


  ngOnInit(): void {

    this.movimientoService.getRetiros().subscribe(data => {
      this.retiros = data;
      this.combinarMovimientos();
    });
    this.movimientoService.getDepositos().subscribe(data => {
      this.depositos = data;
      this.combinarMovimientos();
    });
    this.movimientoService.getTransferencias().subscribe(data => {
      this.transferencias = data;
      this.combinarMovimientos();
    });
    this.loadCajas();
    this.traspasos = [];
    this.cargando = false;
     this.cargarTraspasos();
  }

  /** Une los tres orígenes en una sola lista, etiquetando el tipo de cada movimiento. */
  private combinarMovimientos(): void {
    const marcar = (arr: MovimientoVistaDto[], tipo: string) =>
      (arr || []).map(m => ({ ...m, tipo: m.tipo || tipo }));

    this.movimientos = [
      ...marcar(this.retiros, 'RETIRO'),
      ...marcar(this.depositos, 'DEPOSITO'),
      ...marcar(this.transferencias, 'TRANSFERENCIA'),
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  /** Movimientos tras aplicar todos los filtros activos. */
  get movimientosFiltrados(): MovimientoVistaDto[] {
    const desde = this.filtroDesde ? new Date(this.filtroDesde + 'T00:00:00') : null;
    const hasta = this.filtroHasta ? new Date(this.filtroHasta + 'T23:59:59') : null;

    return this.movimientos.filter(m => {
      const f = new Date(m.fecha);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      if (this.filtroTipo && m.tipo !== this.filtroTipo) return false;
      if (this.filtroCaja && String(m.caja ?? '') !== this.filtroCaja) return false;
      if (this.filtroCuenta && m.cuentaOrigen !== this.filtroCuenta && m.cuentaDestino !== this.filtroCuenta) return false;
      return true;
    });
  }

  /** Cuentas distintas (origen o destino) presentes en los movimientos. */
  get cuentasDisponibles(): string[] {
    const set = new Set<string>();
    this.movimientos.forEach(m => {
      if (m.cuentaOrigen) set.add(m.cuentaOrigen);
      if (m.cuentaDestino) set.add(m.cuentaDestino);
    });
    return Array.from(set).sort();
  }

  /** Cajas distintas presentes en los movimientos (para el filtro). */
  get cajasDisponibles(): string[] {
    const set = new Set<string>();
    this.movimientos.forEach(m => {
      if (m.caja != null && m.caja !== undefined && String(m.caja) !== '') set.add(String(m.caja));
    });
    return Array.from(set).sort();
  }

  limpiarFiltros(): void {
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.filtroTipo = '';
    this.filtroCuenta = '';
    this.filtroCaja = '';
  }
  
  loadCajas() {
    this.cajaService.listar().subscribe(data => this.cajas = data);
  }

  guardarCaja() {
    if (!this.nuevaCaja.name || this.nuevaCaja.saldo === undefined) return;

    this.cajaService.crear(this.nuevaCaja).subscribe({
      next: caja => {
        this.cajas.push(caja);
        this.displayCajaDialog = false;
        this.nuevaCaja = { name: '', saldo: 0 };
      },
      error: () => this.notificationService.error('Error al guardar caja')
    });
  }

   cargarTraspasos(): void {
    this.cargando = true;
    this.traspasosService.getTransaccionesDeHoy().subscribe(
      (data) => {
        this.traspasos = data;
        this.cargando = false;
      },
      (error) => {
        console.error('Error al cargar los traspasos:', error);
        this.cargando = false;
      }
    );
  }

  mostrarDialogo: boolean = false;
movimientoEditando: any = {}; // puede ser MovimientoVistaDto o TransaccionesDTO
tipoEditando: string = '';

abrirDialogo(movimiento: any, tipo: string) {
  this.movimientoEditando = { ...movimiento, tipo }; // clonar y guardar tipo
  this.tipoEditando = tipo;
  this.mostrarDialogo = true;
}

cerrarDialogo() {
  this.mostrarDialogo = false;
  this.movimientoEditando = {};
  this.tipoEditando = '';
}

guardarEdicion() {
  if (!this.movimientoEditando.id) return;

  this.movimientoService.actualizarMovimiento(this.movimientoEditando.id, this.movimientoEditando).subscribe({
   
    next: (movimientoActualizado) => {
     console.log(this.movimientoEditando, "editando");  
     const lista = this.obtenerListaPorTipo(this.tipoEditando);
      const index = lista.findIndex((m: any) => m.id === movimientoActualizado.id);
      if (index > -1) lista[index] = movimientoActualizado;
      this.combinarMovimientos();
    
      this.cerrarDialogo();
    },
    error: () => this.notificationService.error('Error al actualizar el movimiento')
  });
}

private obtenerListaPorTipo(tipo: string) {
  switch (tipo) {
    case 'RETIRO': return this.retiros;
    case 'DEPOSITO': return this.depositos;
    case 'TRANSFERENCIA': return this.transferencias;
    case 'TRASPASO': return this.traspasos;
    default: return [];
  }
}

eliminarMovimiento(movimiento: Movimiento) {
  if (!confirm('¿Eliminar este movimiento? Se revertirán los saldos (y el cupo, si es un retiro de hoy).')) return;
  this.movimientoService.eliminarMovimiento(movimiento).subscribe({
    next: () => {
      this.retiros = this.retiros.filter(m => m.id !== movimiento.id);
      this.depositos = this.depositos.filter(m => m.id !== movimiento.id);
      this.transferencias = this.transferencias.filter(m => m.id !== movimiento.id);
      this.traspasos = this.traspasos.filter(m => m.idtransaccion !== movimiento.idtransaccion);
      this.combinarMovimientos();
      // Los saldos de caja/cuenta cambiaron con la reversa → refrescar.
      this.loadCajas();
      this.notificationService.success('Movimiento eliminado y saldos revertidos');
    },
    error: (err) => {
      const msg = err?.error?.error || 'Error al eliminar el movimiento';
      this.notificationService.error(msg);
    }
  });
}
}
