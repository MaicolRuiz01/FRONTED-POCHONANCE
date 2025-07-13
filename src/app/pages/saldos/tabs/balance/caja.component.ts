import { Component, OnInit } from '@angular/core';
import { BalanceGeneral, BalanceGeneralService } from '../../../../core/services/balance-general.service';
import { DialogModule } from 'primeng/dialog';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [DialogModule
, CommonModule, TableModule, ButtonModule, CurrencyPipe
  ],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css'],
})
export class CajaComponent implements OnInit {
  balances: BalanceGeneral[] = [];
  showDetailsModal = false;
  selectedBalance: BalanceGeneral | null = null;

  constructor(private balanceService: BalanceGeneralService) {}

  ngOnInit() {
    this.loadBalances();
  }

  loadBalances(): void {
    this.balanceService.listar().subscribe({
      next: (data) => {
        this.balances = data;
      },
      error: (err) => {
        console.error('Error cargando balances', err);
      },
    });
  }

  showDetails(balance: BalanceGeneral): void {
    this.selectedBalance = balance;
    this.showDetailsModal = true;
  }

  closeModal(): void {
    this.showDetailsModal = false;
    this.selectedBalance = null;
  }
}
