import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected username = '';
  protected password = '';
  protected hasActiveSession = signal(this.authService.isLoggedIn());
  
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  login(): void {
    if (!this.username || !this.password) {
      this.errorMessage.set('Por favor, preencha todos os campos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.router.navigate([this.authService.getDashboardRoute(res.role)]);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erro de login', err);
        if (err.status === 401) {
          this.errorMessage.set('Credenciais inválidas. Verifique seu número e senha.');
        } else {
        this.errorMessage.set('Erro ao conectar ao servidor. Tente novamente mais tarde.');
        }
      }
    });
  }

  logoutCurrentSession(): void {
    this.authService.logout();
    this.hasActiveSession.set(false);
    this.username = '';
    this.password = '';
    this.errorMessage.set(null);
  }
}
