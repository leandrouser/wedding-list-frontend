import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-couples-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="admin-page">
      <p class="eyebrow">Administrador</p>
      <h2>Noivos</h2>
      <p>Gestao administrativa dos casais cadastrados.</p>
    </section>
  `,
  styles: [`
    .admin-page { padding: 32px; }
    .admin-page h2 { margin: 4px 0 8px; }
    .eyebrow {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }
  `]
})
export class CouplesManagerComponent {}
