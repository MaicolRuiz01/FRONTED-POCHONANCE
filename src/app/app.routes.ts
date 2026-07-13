import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

// Rutas con lazy-loading (loadComponent): cada página se parte en su propio chunk y se carga
// SOLO cuando entras a ella. Así el bundle inicial (y el login) baja muchísimo. El shell
// (AppLayoutComponent) y los guards quedan eager porque se necesitan siempre.
export const routes: Routes = [
  // ── Login (público) ──────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },

  // ── App (protegida) ──────────────────────────────────────────
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/saldos/container/saldos-tab.component').then(m => m.SaldosTabComponent)
      },
      {
        path: 'saldos',
        loadComponent: () => import('./pages/saldos/container/saldos-tab.component').then(m => m.SaldosTabComponent)
      },
      {
        path: 'asignaciones',
        loadComponent: () => import('./pages/asignaciones/container/asignaciones-wrapper/asignaciones-wrapper.component').then(m => m.AsignacionesWrapperComponent)
      },
      {
        path: 'actividades',
        loadComponent: () => import('./pages/activadades/activadestab/activadestab.component').then(m => m.ActivadestabComponent)
      },
      {
        path: 'cuentas/asignacion',
        loadComponent: () => import('./pages/cuentas/asignacion/tab-asignacion/tab-asignacion.component').then(m => m.TabAsignacionComponent)
      },
      {
        path: 'cuentas/:id/ventas',
        loadComponent: () => import('./pages/saldos/tabs/cuentas-tab/lista-ventas/lista-ventas.component').then(m => m.ListaVentasComponent)
      },
      {
        path: 'movimientos',
        loadComponent: () => import('./pages/movimientos/movimientos.component').then(m => m.MovimientosComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/container/clientes-wrapper.component').then(m => m.ClientesComponentW)
      },
      {
        path: 'historial',
        loadComponent: () => import('./pages/historial/container/asignadas/asignadas.component').then(m => m.AsignadasComponent)
      },
      {
        path: 'cambios-arabes',
        loadComponent: () => import('./pages/cambios-arabes/container/container.component').then(m => m.ContainerComponent)
      },
      {
        path: 'p2p',
        loadComponent: () => import('./pages/p2p/p2p-wrapper.component').then(m => m.P2PWrapperComponent)
      },
      {
        path: 'retiradores',
        loadComponent: () => import('./pages/retiradores/retiradores.component').then(m => m.RetiradoresComponent)
      },
      {
        path: 'operadores',
        loadComponent: () => import('./pages/operadores/operadores.component').then(m => m.OperadoresComponent),
        canActivate: [adminGuard]
      },
    ]
  },

  { path: '**', redirectTo: 'saldos' }
];
