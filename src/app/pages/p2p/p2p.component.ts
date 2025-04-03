import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { P2pServiceService } from '../../services/p2pservice/p2p-service.service';

interface P2POrder {
  orderNumber: string;
  account: string;
  tradeType: string;
  amount: number;
  asset: string;
  unitPrice: number;
  createTime: number;  // Assuming createTime is a timestamp
  commission: number;
  accountName: string;
  totalPrice: number;
}

@Component({
  selector: 'app-p2p',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './p2p.component.html',
  styleUrls: ['./p2p.component.css']
})
export class P2pComponent {
  startDate: string = ''; ; // Fecha de inicio para el filtro
  endDate: string = ''; ;   // Fecha de fin para el filtro
  cols: any[] = [];
  products: P2POrder[] = [];  // Use the P2POrder interface
  selectedProducts: any[] = [];

  constructor(private router: Router, private p2pService: P2pServiceService) {}

  ngOnInit() {
    this.cols = [
      { field: 'orderNumber', header: 'Número Orden' },
      { field: 'account', header: 'Cuenta' },
      { field: 'tradeType', header: 'Tipo' },
      { field: 'amount', header: 'Cantidad' },
      { field: 'asset', header: 'Vendido' },
      { field: 'unitPrice', header: 'Tasa' },
      { field: 'createdTime', header: 'Fecha' },
      { field: 'commission', header: 'Comisión' },
      { field: 'accountName', header: 'Nombre de Cuenta' },
      { field: 'totalPrice', header: 'Cantidad pesos' }
    ];
  }

  fetchP2POrders() {
    if (this.startDate && this.endDate) {
      this.p2pService.getP2POrders("MILTON", this.startDate, this.endDate).subscribe({
        next: (response) => {
          console.log('Full response:', response);
          if (response && Array.isArray(response.data)) {
            const formattedData = response.data.map((item: P2POrder) => ({
              ...item,
              createdTime: new Date(item.createTime).toLocaleString()
            }));
            console.log('Data to be loaded in table:', formattedData);
            this.products = formattedData;
          } else {
            console.error('Expected an object containing an array, but got:', typeof response);
            this.products = [];
          }
        },
        error: (error) => {
          console.error('Error fetching P2P orders:', error);
        }
      });
    } else {
      console.error('Start date and end date must be set before fetching orders.');
    }
  }
}
