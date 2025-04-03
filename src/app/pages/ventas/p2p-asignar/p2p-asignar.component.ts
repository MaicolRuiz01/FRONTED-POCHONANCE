import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { Subscription } from 'rxjs';
import { SharedModule } from '../../../shared/shared.module';
import { P2pServiceService } from '../../../services/p2pservice/p2p-service.service';

interface P2POrder {
  createdTime: number; // o string si la fecha viene como cadena
  accountName: string;
  amount: number;
  asignarCuenta?: string; // Si esto se supone que es editable
}

@Component({
  selector: 'app-p2p-asignar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './p2p-asignar.component.html',
  styleUrls: ['./p2p-asignar.component.css']
})
export class P2pAsignarComponent implements OnInit, OnDestroy {
  cols: any[] = [];
  products: P2POrder[] = [];
  selectedProducts: any[] = [];
  subscriptions: Subscription = new Subscription();

  startDate: string = '2025-03-17';
  endDate: string = '2025-03-25';

  cuentasOptions: any[] = [
    { name: 'Enanitas XXX', value: 'cuenta1' },
    { name: 'Trabas 18cm', value: 'cuenta2' },
    { name: 'Cabeza en Vagina', value: 'cuenta3' }
  ];

  constructor(private router: Router, private p2pService: P2pServiceService) {}

  ngOnInit() {
    this.cols = [
      { field: 'createdTime', header: 'Fecha' },
      { field: 'accountName', header: 'Cuenta Binance' },
      { field: 'amount', header: 'Valor' },
      { field: 'asignarCuenta', header: 'Asignar Cuenta' }
    ];
    this.fetchP2POrders();
  }

  fetchP2POrders() {
    this.subscriptions.add(
      this.p2pService.getP2POrders("MILTON", this.startDate, this.endDate).subscribe({
        next: (response) => {
          console.log('Full response:', response);
          this.products = response.data.map((item: P2POrder) => ({
            ...item,
            createdTime: new Date(item.createdTime).toLocaleString()
          }));
        },
        error: (error) => console.error('Error fetching P2P orders:', error)
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe(); // Asegura que todas las suscripciones se cancelen
  }

  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'createdTime', 'equals');
  }
}
