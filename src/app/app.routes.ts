import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { MypageComponent } from './core/components/mypage/mypage.component';
import { NuevaVistaComponent } from './pages/nueva-vista/nueva-vista.component';

export const routes: Routes = [  {
  path:'',
  component:AppLayoutComponent,
  children:[
    {path:'', component:MypageComponent,},
    { path: 'nueva-vista', component: NuevaVistaComponent }
  ]
}, // Nueva ruta
  { path: '**', redirectTo: 'nueva-vista' } ];
