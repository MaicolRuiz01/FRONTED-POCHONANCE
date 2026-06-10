import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';

import { VentasPendientesComponent } from './tabs/ventas-pendientes/ventas-pendientes.component';
import { VentasAsignadasComponent } from './tabs/ventas-asignadas/ventas-asignadas.component';
import { ComprasP2pComponent } from './tabs/compras-p2p/compras-p2p.component';
import { ReglasP2pComponent } from './tabs/reglas-p2p/reglas-p2p.component';
import { P2PSyncService, P2PSyncState } from '../../core/services/p2p-sync.service';

@Component({
  selector: 'app-p2p-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    ButtonModule,
    TagModule,
    ToastModule,
    VentasPendientesComponent,
    VentasAsignadasComponent,
    ComprasP2pComponent,
    ReglasP2pComponent
  ],
  providers: [MessageService],
  templateUrl: './p2p-wrapper.component.html',
  styleUrls: ['./p2p-wrapper.component.css']
})
export class P2PWrapperComponent implements OnInit, OnDestroy {
  syncStates: P2PSyncState[] = [];
  syncing = false;
  pendingCount = 0;

  constructor(
    private syncService: P2PSyncService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadSyncStatus();
  }

  ngOnDestroy(): void {}

  loadSyncStatus(): void {
    this.syncService.getSyncStatus().subscribe({
      next: states => this.syncStates = states ?? []
    });
  }

  triggerSync(): void {
    if (this.syncing) return;
    this.syncing = true;
    this.syncService.triggerSync()
      .pipe(finalize(() => this.syncing = false))
      .subscribe({
        next: result => {
          this.loadSyncStatus();
          this.messageService.add({
            severity: result.nuevasVentas > 0 ? 'success' : 'info',
            summary: 'Sincronización',
            detail: result.mensaje,
            life: 4000
          });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo sincronizar.' })
      });
  }

  onSseRefresh(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Nuevas ventas',
      detail: 'Se detectaron ventas P2P nuevas — tabla actualizada.',
      life: 4000
    });
    this.loadSyncStatus();
  }

  formatSyncTime(state: P2PSyncState): string {
    if (!state.lastSyncTime) return 'Nunca';
    const d = new Date(state.lastSyncTime);
    return new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
  }
}
