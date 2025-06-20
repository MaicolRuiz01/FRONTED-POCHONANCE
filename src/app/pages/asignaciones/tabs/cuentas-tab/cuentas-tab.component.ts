import { Component, OnInit } from '@angular/core';
import { AccountCopService, AccountCop, AccountCopCreate } from '../../../../../../src/app/core/services/account-cop.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cuentas-tab',
  standalone: true,
  imports: [DialogModule, ButtonModule, FormsModule, TableModule, InputTextModule, CardModule, CommonModule ],
  templateUrl: './cuentas-tab.component.html',
  styleUrls: ['./cuentas-tab.component.css']
})
export class CuentasTabComponent implements OnInit {
  cuentas: AccountCop[] = [];
  newAccount: AccountCopCreate = { name: '', balance: 0 };
  displayDialog: boolean = false;

  constructor(private accountService: AccountCopService) {}

  ngOnInit(): void {
    this.loadCuentas();
  }

  loadCuentas() {
    this.accountService.getAll().subscribe({
      next: (cuentas: AccountCop[]) => {
        console.log('Cuentas recibidas:', cuentas);
        this.cuentas = cuentas;
      },
      error: (err: any) => {
        console.error('Error al cargar cuentas:', err.message, err);
      }
    });
    
  }

  createAccount() {
    console.log('Creating Account:', this.newAccount);
    this.accountService.create(this.newAccount).subscribe(account => {
      this.cuentas.push(account);
      this.displayDialog = false;
      this.newAccount = { name: '', balance: 0 }; // Reseteo sin ID
    }, error => {
      console.error('Error creating account', error);
    });
  }

  showCreateDialog() {
    this.displayDialog = true;
  }
}