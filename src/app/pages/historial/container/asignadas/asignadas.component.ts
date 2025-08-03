import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { SellTabComponent } from '../../tabs/sell-tab/sell-tab.component';
import { BuyTapComponent } from '../../tabs/buy-tap/buy-tap.component';
@Component({
  selector: 'app-asignadas',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    SellTabComponent,
    BuyTapComponent
  ],
  templateUrl: './asignadas.component.html',
  styleUrl: './asignadas.component.css'
})
export class AsignadasComponent {

}
