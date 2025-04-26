import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { MypageComponent } from './core/components/mypage/mypage.component';

import { CajaComponent } from './pages/balance/caja/caja.component';

import { SaldosComponent } from './pages/cuentas/saldos/saldos.component';
import { ComprasComponent } from './pages/compras/compras.component';


import { AsignarCompraComponent } from './pages/asignar-compra/asignar-compra.component';
import { VerficacionComponent } from './pages/balance/verficacion/verficacion.component';
import { GastosComponent } from './pages/gastos/gastos.component';


import { AsignacionesWrapperComponent } from './pages/asignaciones/container/asignaciones-wrapper/asignaciones-wrapper.component';



export const routes: Routes = [  {
  path:'',
  component:AppLayoutComponent,
  children:[
    {path:'', component:MypageComponent,},

    {path:'balance/caja', component:CajaComponent},
    {
      path: 'asignaciones',
      component: AsignacionesWrapperComponent
    },
    


    {path:'cuentas/compras', component:ComprasComponent},
    {path:'gastos', component:GastosComponent},
    {path:'ventas/asignar/compras', component:AsignarCompraComponent},

  ]
}, // Nueva ruta
  { path: '**', redirectTo: 'nueva-vista' } ];
