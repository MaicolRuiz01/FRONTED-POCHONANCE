import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    RippleModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  username = '';
  password = '';
  loading  = false;
  error    = '';

  constructor(private auth: AuthService, private router: Router) {}

  login(): void {
    if (!this.username || !this.password) {
      this.error = 'Ingresa usuario y contraseña.';
      return;
    }
    this.loading = true;
    this.error   = '';

    this.auth.login({ username: this.username, password: this.password })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => this.router.navigate(['/saldos']),
        error: (err) => {
          this.error = err?.error?.error ?? 'Error al iniciar sesión. Verifica tus credenciales.';
        }
      });
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.login();
  }
}
