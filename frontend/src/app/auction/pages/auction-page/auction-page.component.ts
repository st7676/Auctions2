import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuctionListComponent } from '../../components/auction-list/auction-list.component';
import { AuctionDetailsComponent } from '../../components/auction-details/auction-details.component';

@Component({
  selector: 'app-auction-page',
  standalone: true,
  imports: [CommonModule, AuctionListComponent, AuctionDetailsComponent],
  templateUrl: './auction-page.component.html',
  styleUrl: './auction-page.component.css'
})
export class AuctionPageComponent {
  selectedAuction: any = null;

  onSelect(a: any) {
    this.selectedAuction = a;
  }
  
}
