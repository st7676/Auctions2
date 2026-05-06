import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuctionService } from '../../../core/services/auction.service';
import { Auction } from '../../../core/model/auction.model';
import { SignalRService } from '../../../core/services/signalr.service';


@Component({
  selector: 'app-auction-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auction-list.component.html',
  styleUrl: './auction-list.component.css'
})
export class AuctionListComponent implements OnInit {

  auctions: Auction[] = [];

  @Output() selectAuction = new EventEmitter<any>();

  constructor(private auctionService: AuctionService, private signalR: SignalRService) { }

  loadAuctions() {
    this.auctionService.getAuctions()
      .subscribe(data => {
        this.auctions = data;
      });
  }

  select(a: Auction) {
    this.selectAuction.emit(a);
  }

  ngOnInit() {
    this.loadAuctions();

    this.signalR.auctionUpdated$.subscribe(update => {

      // אם זה עדכון מחיר
      if (update && update.id) {
        const auction = this.auctions.find(a => a.id === update.id);

        if (auction) {
          auction.currentPrice = update.currentPrice;
        }
      }

      // אם מכירה נסגרה
      if (update && update.auctionId) {
        const auction = this.auctions.find(a => a.id === update.auctionId);

        if (auction) {
          auction.isClosed = true;
        }
      }

    });
  }
}