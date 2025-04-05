import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { MypageComponent } from './core/components/mypage/mypage.component';
import { NuevaVistaComponent } from './pages/nueva-vista/nueva-vista.component';
import { CajaComponent } from './pages/balance/caja/caja.component';
import { CompletadaComponent } from './pages/cripto/completada/completada.component';
import { SaldosComponent } from './pages/cuentas/saldos/saldos.component';
import  {TraspasosComponent} from './pages/cuentas/traspasos/traspasos.component';
import { CompletasVentasComponent } from './pages/ventas/completas-ventas/completas-ventas.component';
import { P2pAsignarComponent } from './pages/ventas/p2p-asignar/p2p-asignar.component';
import { ComprasComponent } from './pages/compras/compras.component';
import { P2pComponent } from './pages/p2p/p2p.component';
import { VentasGeneralesComponent } from './pages/ventas-generales/ventas-generales.component';
import { ImpuestosComponent } from './pages/impuestos/impuestos.component';
import { TrxComponent } from './pages/trx/trx.component';
import { AsignarCompraComponent } from './pages/asignar-compra/asignar-compra.component';
import { VerficacionComponent } from './pages/balance/verficacion/verficacion.component';
import { GastosComponent } from './pages/gastos/gastos.component';
import { AsignacionComponent } from './pages/cuentas/asignacion/asignacion.component';


export const routes: Routes = [  {
  path:'',
  component:AppLayoutComponent,
  children:[
    {path:'', component:MypageComponent,},
    { path: 'nueva-vista', component: NuevaVistaComponent },
    {path:'balance/caja', component:CajaComponent},
    {path:'balance/completas', component:VerficacionComponent},
    {path:'cripto', component:CompletadaComponent},
    {path:'cuentas/saldos', component:SaldosComponent},
    {path:'cuentas/traspasos', component:TraspasosComponent},
    {path:'cuentas/compras', component:ComprasComponent},
    {path:'cuentas/p2p', component:P2pComponent},
    {path:'cuentas/ventasgenerales', component:VentasGeneralesComponent},
    {path:'cuentas/impuestos', component:ImpuestosComponent},
    {path:'cuentas/trx', component:TrxComponent},
    {path:'cuentas/asignacion', component:AsignacionComponent},
    {path:'gastos', component:GastosComponent},
    {path:'ventas/asignar/p2p', component:P2pAsignarComponent},
    {path:'ventas/asignar/compras', component:AsignarCompraComponent},
    {path:'ventas/completas', component:CompletasVentasComponent}

  ]
}, // Nueva ruta
  { path: '**', redirectTo: 'nueva-vista' } ];
