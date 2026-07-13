import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected countdown = 3;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const giftListId = params['giftListId'];

      const interval = setInterval(() => {
        this.countdown--;
        if (this.countdown === 0) {
          clearInterval(interval);
          if (giftListId) {
            this.router.navigate(['/lista', giftListId]);
          } else {
            this.router.navigate(['/']);
          }
        }
      }, 1000);
    });
  }
}