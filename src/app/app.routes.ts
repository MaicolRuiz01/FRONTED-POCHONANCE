import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';

import { CajaComponent } from './pages/saldos/tabs/balance/caja.component';
import { CompletadaComponent } from './pages/movimientos/criptos/listadocripto/completada.component';
import { SaldosComponent } from './pages/saldos/tabs/saldos-cuentas/saldos.component';
import { TabAsignacionComponent } from './pages/cuentas/asignacion/tab-asignacion/tab-asignacion.component';
import { SaldosTabComponent } from './pages/saldos/container/saldos-tab.component';
import { ClientesComponentW } from './pages/clientes/container/clientes-wrapper.component';
import { AsignacionesWrapperComponent } from './pages/asignaciones/container/asignaciones-wrapper/asignaciones-wrapper.component';
import { ActivadestabComponent } from './pages/activadades/activadestab/activadestab.component';
import { MovimientosComponent } from './pages/movimientos/movimientos.component';
import { AsignadasComponent } from './pages/historial/container/asignadas/asignadas.component';
import { ContainerComponent } from './pages/cambios-arabes/container/container.component';
import { P2PWrapperComponent } from './pages/p2p/p2p-wrapper.component';
import { RetiradoresComponent } from './pages/retiradores/retiradores.component';
import { LoginComponent } from './auth/login/login.component';
import { OperadoresComponent } from './pages/operadores/operadores.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ── Login (público) ──────────────────────────────────────────
  { path: 'login', component: LoginComponent },

  // ── App (protegida) ──────────────────────────────────────────
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '',               component: SaldosTabComponent },
      { path: 'saldos',         component: SaldosTabComponent },
      { path: 'asignaciones',   component: AsignacionesWrapperComponent },
      { path: 'actividades',    component: ActivadestabComponent },
      { path: 'cuentas/asignacion', component: TabAsignacionComponent },
      {
        path: 'cuentas/:id/ventas',
        loadComponent: () =>
          import('./pages/saldos/tabs/cuentas-tab/lista-ventas/lista-ventas.component')
            .then(m => m.ListaVentasComponent)
      },
      { path: 'movimientos',    component: MovimientosComponent },
      { path: 'clientes',       component: ClientesComponentW },
      { path: 'historial',      component: AsignadasComponent },
      { path: 'cambios-arabes', component: ContainerComponent },
      { path: 'p2p',            component: P2PWrapperComponent },
      { path: 'retiradores',    component: RetiradoresComponent },
      { path: 'operadores',     component: OperadoresComponent, canActivate: [adminGuard] },
    ]
  },

  { path: '**', redirectTo: 'saldos' }
];
