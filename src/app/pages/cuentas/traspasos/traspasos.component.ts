import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { SharedModule } from '../../../shared/shared.module';
import { TraspasosService } from '../../../core/services/traspasos.service';
import { Transaction } from '../../../core/services/transaction.model';
import { TagModule } from 'primeng/tag';


@Component({
  selector: 'app-traspasos',
  standalone: true,
  imports: [CommonModule, TableModule, DropdownModule, SharedModule,TagModule],
  templateUrl: './traspasos.component.html',
})
export class TraspasosComponent implements OnInit {
  cols: any[] = [
    { field: 'transactionTime', header: 'Fecha', dateFormat: true },
    { field: 'fromAccount', header: 'Cuenta Salida' },
    { field: 'toAccount', header: 'Cuenta Entrada' },
    { field: 'currency', header: 'Moneda' },
    { field: 'amount', header: 'Valor' },
    { field: 'totalPaymentFee', header: 'Comisión' }
  ];

  products: any[] = [];
  accounts = ['MILTON', 'CESAR', 'MARCEL'];
  selectedAccount: string = 'MILTON';

  // 🧠 Mapeo de usuarios por ID
  USERS_MAP: { [id: number]: string } = {
    68264684: 'MILTON',
    151620352: 'CESAR',
    506549490: 'MARCEL'
  };

  constructor(private traspasosService: TraspasosService) {}

  ngOnInit() {
    this.fetchTraspasosHistory(this.selectedAccount);
  }

  fetchTraspasosHistory(account: string) {
    this.traspasosService.getTraspasosHistory(account).subscribe({
      next: (response) => {
        console.log('Respuesta backend:', response);

        if (response && response.data && Array.isArray(response.data)) {
          this.products = response.data.map((item: Transaction) => {
            const getUserLabel = (id?: number, fallback?: string): string => {
              if (id && this.USERS_MAP[id]) {
                return this.USERS_MAP[id];
              }
              return fallback ?? 'Desconocido';
            };

            const from = getUserLabel(
              item.payerInfo?.binanceId,
              item.payerInfo?.email
                ?? (item.payerInfo?.binanceId
                  ? `ID: ${item.payerInfo.binanceId}`
                  : item.payerInfo?.name)
            );

            const to = getUserLabel(
              item.receiverInfo?.accountId ?? item.receiverInfo?.binanceId,
              item.receiverInfo?.email
                ?? (item.receiverInfo?.accountId
                  ? `ID: ${item.receiverInfo.accountId}`
                  : item.receiverInfo?.name)
            );

            return {
              ...item,
              transactionTime: new Date(item.transactionTime),
              fromAccount: from,
              toAccount: to
            };
          });

          console.log('✅ Products procesados:', this.products);
        } else {
          this.products = [];
          console.warn('⚠️ Formato de respuesta inesperado o vacío');
        }
      },
      error: (error) => console.error('❌ Error fetching traspasos:', error)
    });
  }

  onAccountChange(event: any) {
    this.selectedAccount = event.value;
    this.fetchTraspasosHistory(this.selectedAccount);
  }
  getAmountSeverity(amount: string): 'success' | 'danger' | undefined {
    if (!amount) return undefined;
    const parsed = parseFloat(amount);
    return parsed < 0 ? 'danger' : 'success';
  }

  getFormattedAmount(amount: string, currency: string): string {
    const parsed = parseFloat(amount);
    const abs = Math.abs(parsed);
    return `${parsed < 0 ? '-' : '+'}${abs.toLocaleString()} ${currency}`;
  }


}
