import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SignalRService {

    private hubConnection!: signalR.HubConnection;

    private auctionUpdatedSubject = new Subject<any>();
    auctionUpdated$ = this.auctionUpdatedSubject.asObservable();

    startConnection() {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl('https://localhost:7147/auctionHub')
            .withAutomaticReconnect()
            .build();

        this.hubConnection
            .start()
            .then(() => console.log('SignalR Connected'))
            .catch(err => console.log('Error: ', err));

        this.listenToEvents();
    }

    private listenToEvents() {

        //  כשהשרת שולח עדכון על bid חדש
        this.hubConnection.on('BidUpdated', (auction) => {
            console.log('Received from server:', auction);
            this.auctionUpdatedSubject.next(auction);
        });

        //  כשהמכירה נסגרת
        // this.hubConnection.on('AuctionClosed', (auctionId) => {
        //   this.auctionUpdatedSubject.next({ auctionId, closed: true });
        // });
    }
}