import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { MypageComponent } from './core/components/mypage/mypage.component';
import { NuevaVistaComponent } from './pages/nueva-vista/nueva-vista.component';
import { CajaComponent } from './pages/balance/caja/caja.component';
import { CompletadaComponent } from './pages/cripto/completada/completada.component';
import { SaldosComponent } from './pages/cuentas/saldos/saldos.component';
import { ComprasComponent } from './pages/compras/compras.component';
import { VentasGeneralesComponent } from './pages/ventas-generales/ventas-generales.component';
import { ImpuestosComponent } from './pages/impuestos/impuestos.component';
import { TrxComponent } from './pages/trx/trx.component';
import { AsignarCompraComponent } from './pages/asignar-compra/asignar-compra.component';
import { GastosComponent } from './pages/gastos/gastos.component';
import { TabAsignacionComponent } from './pages/cuentas/asignacion/tab-asignacion/tab-asignacion.component';
import { SaldosTabComponent } from './pages/cuentas/saldos/saldos-tab/saldos-tab.component';


import { AsignacionesWrapperComponent } from './pages/asignaciones/container/asignaciones-wrapper/asignaciones-wrapper.component';
import { ActivadestabComponent } from './pages/activadades/activadestab/activadestab.component';



export const routes: Routes = [  {
  path:'',
  component:AppLayoutComponent,
  children:[
    {path:'', component:MypageComponent,},
    { path: 'nueva-vista', component: NuevaVistaComponent },
    {path:'balance/caja', component:CajaComponent},
    {
      path: 'asignaciones',
      component: AsignacionesWrapperComponent
    },
    {
      path: 'actividades',
      component: ActivadestabComponent
    },
    {
      path: 'cuentas/saldos',
      component: SaldosTabComponent
    },


    {path:'cripto', component:CompletadaComponent},
    {path:'cuentas/compras', component:ComprasComponent},

    {path:'cuentas/ventasgenerales', component:VentasGeneralesComponent},
    {path:'cuentas/impuestos', component:ImpuestosComponent},
    {path:'cuentas/trx', component:TrxComponent},
    {path:'cuentas/asignacion', component:TabAsignacionComponent},
    {path:'gastos', component:GastosComponent},
    {path:'ventas/asignar/compras', component:AsignarCompraComponent},

  ]
}, // Nueva ruta
  { path: '**', redirectTo: 'nueva-vista' } ];
