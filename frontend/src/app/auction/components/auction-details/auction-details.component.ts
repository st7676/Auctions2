import { Component, Input, OnInit, OnDestroy } from '@angular/core';import { CommonModule } from '@angular/common';
import { Auction } from '../../../core/model/auction.model';
import { FormsModule } from '@angular/forms';
import { AuctionService } from '../../../core/services/auction.service';


@Component({
  selector: 'app-auction-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auction-details.component.html',
  styleUrl: './auction-details.component.css'
})
export class AuctionDetailsComponent implements OnInit, OnDestroy {
  constructor(private auctionService: AuctionService) { }
  @Input() auction!: Auction;
  tick = 0;
  bidAmount: number = 0;

  intervalId: any;
getRemainingTime(): string {
  if (!this.auction?.endTime) return '';

  const endTime = new Date(this.auction.endTime).getTime();
  const now = Date.now();

  const diff = endTime - now;

  if (diff <= 0) return 'Ended';

  const totalSeconds = Math.floor(diff / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const format = (n: number) => n.toString().padStart(2, '0');

  return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
}
ngOnInit() {
  this.intervalId = setInterval(() => {
    this.tick++;
  }, 1000);
}

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

placeBid() {
  if (!this.auction) return;

  if (this.bidAmount <= this.auction.currentPrice) {
    alert('Bid must be higher than current price');
    return;
  }

  this.auctionService.placeBid(this.auction.id, this.bidAmount)
    .subscribe({
      next: () => {
        console.log('Bid sent to server');
      },
      error: err => {
        console.error('Error placing bid', err);
      }
    });
}
}
