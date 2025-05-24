import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { MypageComponent } from './core/components/mypage/mypage.component';

import { CajaComponent } from './pages/saldos/tabs/balance/caja.component';
import { CompletadaComponent } from './pages/cripto/completada/completada.component';
import { SaldosComponent } from './pages/saldos/tabs/saldos-cuentas/saldos.component';

import { GastosComponent } from './pages/saldos/tabs/gastos/gastos.component';
import { TabAsignacionComponent } from './pages/cuentas/asignacion/tab-asignacion/tab-asignacion.component';
import { SaldosTabComponent } from './pages/saldos/container/saldos-tab.component';


import { AsignacionesWrapperComponent } from './pages/asignaciones/container/asignaciones-wrapper/asignaciones-wrapper.component';
import { ActivadestabComponent } from './pages/activadades/activadestab/activadestab.component';



export const routes: Routes = [  {
  path:'',
  component:AppLayoutComponent,
  children:[
    {path:'', component:MypageComponent,},

    {
      path: 'asignaciones',
      component: AsignacionesWrapperComponent
    },
    {
      path: 'actividades',
      component: ActivadestabComponent
    },
    {
      path: 'saldos',
      component: SaldosTabComponent
    },




    {path:'cuentas/asignacion', component:TabAsignacionComponent},


  ]
}, // Nueva ruta
  { path: '**', redirectTo: 'nueva-vista' } ];
