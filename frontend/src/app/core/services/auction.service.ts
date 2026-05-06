import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auction } from '../model/auction.model.js';

@Injectable({
  providedIn: 'root'
})

export class AuctionService {
  private baseUrl = 'https://localhost:7147/api/auctions';

  constructor(private http: HttpClient) {}
    // 📌 קבלת כל המכירות
  getAuctions(): Observable<Auction[]> {
    return this.http.get<Auction[]>(this.baseUrl);
  }

  // 📌 קבלת מכירה לפי ID
  getAuction(id: number): Observable<Auction> {
    return this.http.get<Auction>(`${this.baseUrl}/${id}`);
  }

  // 📌 שליחת bid
  placeBid(id: number, amount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/bid`, { amount });
  }
}
