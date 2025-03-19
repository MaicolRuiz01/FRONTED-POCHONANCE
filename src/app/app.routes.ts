import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { MypageComponent } from './core/components/mypage/mypage.component';
import { NuevaVistaComponent } from './pages/nueva-vista/nueva-vista.component';
import { CajaComponent } from './pages/balance/caja/caja.component';
import { CompletasComponent } from './pages/balance/completas/completas.component';
import { CompletadaComponent } from './pages/cripto/completada/completada.component';
import { VistaComponent } from './pages/cripto/vista/vista.component';
import { SaldosComponent } from './pages/cuentas/saldos/saldos.component';
import  {TraspasosComponent} from './pages/cuentas/traspasos/traspasos.component';
import { OperativoComponent } from './pages/gastos/operativo/operativo.component';
import { OtroComponent } from './pages/gastos/otro/otro.component';
import { CompletasVentasComponent } from './pages/ventas/completas-ventas/completas-ventas.component';
import { P2pAsignarComponent } from './pages/ventas/p2p-asignar/p2p-asignar.component';



export const routes: Routes = [  {
  path:'',
  component:AppLayoutComponent,
  children:[
    {path:'', component:MypageComponent,},
    { path: 'nueva-vista', component: NuevaVistaComponent },
    {path:'balance/caja', component:CajaComponent},
    {path:'balance/completas', component:CompletasComponent},
    {path:'cripto/completada', component:CompletadaComponent},
    {path:'cripto/vista', component:VistaComponent},
    {path:'cuentas/saldos', component:SaldosComponent},
    {path:'cuentas/traspasos', component:TraspasosComponent},
    {path:'gastos/operativo', component:OperativoComponent},
    {path:'gastos/otro', component:OtroComponent},
    {path:'ventas/asignar/p2p', component:P2pAsignarComponent},
    {path:'ventas/completas-ventas', component:CompletasVentasComponent}

  ]
}, // Nueva ruta
  { path: '**', redirectTo: 'nueva-vista' } ];
