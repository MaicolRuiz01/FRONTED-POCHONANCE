import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { SaleP2PDto } from '../../../../../core/services/sale-p2p.service';
import { ActivatedRoute } from '@angular/router';
import { AccountCopService } from '../../../../../core/services/account-cop.service';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../../../../environment/environment';

@Component({
  selector: 'app-lista-ventas',
  standalone: true,
  imports: [CommonModule, TableModule,CardModule,ButtonModule ],
  templateUrl: './lista-ventas.component.html',
  styleUrls: ['./lista-ventas.component.css']
})
export class ListaVentasComponent implements OnInit {
  ventas: any[] = [];
  apiUrl: string = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private accountCopService: AccountCopService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const accountId = Number(this.route.snapshot.paramMap.get('id'));
    if (accountId) {
      this.accountCopService.getSalesByAccountCopId(accountId).subscribe({
        next: (ventas) => this.ventas = ventas,
        error: (err) => console.error('Error al cargar ventas', err)
      });
    }
  }
   goBack(): void {
    this.router.navigate(['/saldos']); // Navegar a la página de saldos
  }
}