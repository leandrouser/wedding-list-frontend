import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-failure',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-failure.component.html',
  styleUrls: ['./payment-failure.component.scss']
})
export class PaymentFailureComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected countdown = 5;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const giftListId = params['giftListId'];
      const status = params['status'];

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