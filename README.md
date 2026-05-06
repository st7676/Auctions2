# 🏆 Auction System – Real-Time Bidding Platform

## 📌 Overview

A **real-time auction platform** where users can browse auctions, place bids, and receive instant updates when prices change. Perfect for learning full-stack development with modern web technologies.

**Tech Stack:**
- **Frontend:** Angular 18+ (Standalone Components)
- **Backend:** ASP.NET Core 8
- **Database:** SQLite + Entity Framework Core
- **Real-time:** SignalR (WebSocket)
- **Communication:** REST API + WebSocket

---

## 🏗️ Architecture – 3 Layers

### 1. **Presentation Layer (Frontend - Angular)**
```
frontend/src/app/
├── app.component.ts          ← Root component (starts SignalR)
├── auction/
│   ├── pages/
│   │   └── auction-page/     ← Main page layout
│   └── components/
│       ├── auction-list/     ← Display all auctions
│       └── auction-details/  ← Selected auction + bid form
└── core/
    ├── services/
    │   ├── auction.service.ts      ← HTTP calls
    │   └── signalr.service.ts      ← WebSocket connection
    └── model/
        └── auction.model.ts        ← TypeScript interfaces
```

### 2. **API Layer (ASP.NET Core)**
```
backend/backend/
├── Controllers/
│   └── AuctionsController.cs    ← REST endpoints
├── Hubs/
│   └── AuctionHub.cs            ← SignalR Hub
├── Models/
│   ├── Auction.cs
│   ├── Bid.cs
│   └── BidRequest.cs
├── Data/
│   └── AppDbContext.cs          ← EF Core DbContext
└── Program.cs                   ← Server config
```

### 3. **Data Layer (Entity Framework Core)**
```
SQLite Database (auction.db)
├── Auctions Table
├── Bids Table
└── Migrations
```

---

## 📊 Database Schema

### **Auctions Table**
```csharp
public class Auction
{
    public int Id { get; set; }
    public string Title { get; set; }           // Auction name
    public decimal CurrentPrice { get; set; }   // Highest bid
    public DateTime EndTime { get; set; }       // When auction closes
    public bool IsClosed { get; set; }          // Is auction finished?
    
    [Timestamp]
    public byte[]? RowVersion { get; set; }     // Concurrency control
}
```

### **Bids Table**
```csharp
public class Bid
{
    public int Id { get; set; }
    public int AuctionId { get; set; }          // Foreign key
    public decimal Amount { get; set; }         // Bid amount
    public DateTime CreatedAt { get; set; }     // When bid was placed
}
```

### **BidRequest DTO** (Request from Frontend)
```csharp
public class BidRequest
{
    public decimal Amount { get; set; }         // New bid amount
    public byte[] RowVersion { get; set; }      // For concurrency check
}
```

---

## 🚀 Core Features

### 1. **Auctions List**
✅ Display all auctions  
✅ Show: Title, Current Price, Status, Time Remaining  
✅ Click to select auction for details

**Frontend Code:**
```typescript
// AuctionListComponent
auctions: Auction[] = [];

ngOnInit() {
  // Load initial data from API
  this.loadAuctions();
  
  // Subscribe to real-time updates
  this.signalR.auctionUpdated$.subscribe(update => {
    // Update auction price when bid comes in
    const auction = this.auctions.find(a => a.id === update.id);
    if (auction) {
      auction.currentPrice = update.currentPrice;
    }
  });
}
```

### 2. **Auction Details & Bidding**
✅ View selected auction details  
✅ Place new bid (must be higher than current)  
✅ Countdown timer showing remaining time  
✅ Real-time price updates

**Frontend Code:**
```typescript
// AuctionDetailsComponent
placeBid() {
  if (this.bidAmount <= this.auction.currentPrice) {
    alert('Bid must be higher than current price');
    return;
  }
  
  this.auctionService.placeBid(this.auction.id, this.bidAmount)
    .subscribe({
      next: () => console.log('Bid accepted'),
      error: (err) => alert('Bid failed: ' + err.error.message)
    });
}

// Countdown timer
getRemainingTime(): string {
  const endTime = new Date(this.auction.endTime).getTime();
  const diff = endTime - Date.now();
  
  if (diff <= 0) return 'Ended';
  
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return `${hours}:${minutes}:${seconds}`;
}
```

### 3. **Real-Time Updates (SignalR)**
✅ Instant price updates across all clients  
✅ Automatic reconnection on network loss  
✅ Server broadcasts tcted users

**Backend (when bid is placed):**
```csharp
// After successful bid
await _hub.Clients.All.SendAsync("BidUpdated", new
{
    id = auction.Id,
    currentPrice = auction.CurrentPrice,
    rowVersion = auction.RowVersion
});
```

**Frontend (listening):**
```typescript
// SignalRService
private listenToEvents() {
  this.hubConnection.on('BidUpdated', (update) => {
    this.auctionUpdatedSubject.next(update);
  });
}
```

### 4. **Concurrency Control (Race Condition Prevention)**
✅ Prevents overbidding conflicts  
✅ Uses **Optimistic Concurrency** with RowVersion  

**The Problem:**
```
Timeline:
User A reads: Price = $100, RowVersion = v1
User B reads: Price = $100, RowVersion = v1
User A bids $110 ✅ (saves with v1, increments to v2)
User B bids $105 ❌ (tries to save with v1, but now it's v2 → Conflict!)
```

**The Solution:**
```csharp
// In PlaceBid endpoint
try
{
    auction.CurrentPrice = request.Amount;
    
    // Tell EF Core to check RowVersion before saving
    _context.Entry(auction)
        .Property(a => a.RowVersion)
        .OriginalValue = request.RowVersion;
    
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException)
{
    // Someone beat us to it!
    return Conflict(new { message = "Someone already placed a higher bid" });
}
```

---

## 🔌 API Endpoints

### **Auctions**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auctions` | Get all auctions |
| POST | `/api/auctions` | Create new auction |

### **Bids**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auctions/{id}/bid` | Place bid on auction |

**POST `/api/auctions/{id}/bid` - Request/Response:**
```json
// Request
{
  "amount": 150.50,
  "rowVersion": "base64encodedstring"
}

// Success Response (200 OK)
{
  "message": "Bid accepted",
  "newPrice": 150.50,
  "rowVersion": "newbase64encodedstring"
}

// Conflict Response (409)
{
  "message": "Someone already placed a higher bid"
}

// Validation Error Response (400)
{
  "message": "Bid must be higher than current price"
}
```

---

## 📡 SignalR Hub

### **Hub Location**
```
Endpoint: wss://localhost:7147/auctionHub
```

### **Events**
| Event | Sent by | Data | Purpose |
|-------|---------|------|---------|
| `BidUpdated` | Server | `{ id, currentPrice, rowVersion }` | Broadcast new bid to all clients |

---

## 🔐 CORS Configuration

The backend allows requests from the frontend with credentials (required for SignalR):

```csharp
// In Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:4200")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials(); // ⚠️ Required for SignalR
        });
});
```

---

## 🚀 How to Run

### **Prerequisites**
- .NET 8 SDK
- Node.js 18+
- npm

### **Backend Setup**
```bash
cd backend
dotnet restore
dotnet run
```
✅ Runs on: `https://localhost:7147`  
📊 Swagger UI: `https://localhost:7147/swagger`

### **Frontend Setup**
```bash
cd frontend
npm install
ng serve
```
✅ Runs on: `http://localhost:4200`

---

## 📝 Data Flow Example – Placing a Bid

1. **User clicks "Place Bid"** (Frontend)
   ```typescript
   this.auctionService.placeBid(auctionId, bidAmount)
   ```

2. **HTTP POST sent to Backend**
   ```
   POST /api/auctions/5/bid
   Body: { amount: 150, rowVersion: "abc123..." }
   ```

3. **Server validates bid**
   ```csharp
   ✓ Auction exists?
   ✓ Auction not closed?
   ✓ New bid > current price?
   ✓ RowVersion matches (no race condition)?
   ```

4. **Database updated**
   ```
   UPDATE Auctions SET CurrentPrice = 150, RowVersion = [new]
   INSERT INTO Bids (AuctionId, Amount, CreatedAt)
   ```

5. **Server broadcasts to all clients**
   ```csharp
   await hub.Clients.All.SendAsync("BidUpdated", 
       { id: 5, currentPrice: 150, rowVersion: "xyz789..." });
   ```

6. **All connected clients receive update**
   ```typescript
   this.hubConnection.on('BidUpdated', (update) => {
       this.auctionUpdatedSubject.next(update);
   });
   ```

7. **Frontend updates UI**
   ```typescript
   // AuctionListComponent
   auction.currentPrice = update.currentPrice;
   // View automatically re-renders with new price
   ```

---

## 🔍 Key Design Decisions

| Decision | Why |
|----------|-----|
| **Angular Standalone Components** | Simpler, no NgModule boilerplate, modern Angular standard |
| **REST API** | Standard, simple to use, stateless |
| **SignalR for real-time** | Better than polling, built-in reconnection, native WebSocket support |
| **Optimistic Concurrency** | Minimal database locks, fast transactions, prevents overbidding |
| **SQLite** | Lightweight, no server setup, perfect for development |
| **Entity Framework Core** | Type-safe, automatic migrations, LINQ queries |

---

## ⚠️ Error Handling

### **Frontend**
```typescript
this.auctionService.placeBid(auctionId, amount)
  .subscribe({
    next: (response) => {
      console.log('Bid accepted:', response.newPrice);
    },
    error: (error) => {
      if (error.status === 409) {
        alert('Someone beat you to it!');
      } else if (error.status === 400) {
        alert(error.error.message);
      } else {
        alert('Network error');
      }
    }
  });
```

### **Backend**
```csharp
// 404 Not Found
if (auction == null)
    return NotFound();

// 400 Bad Request
if (auction.IsClosed)
    return BadRequest("Auction is closed");

if (request.Amount <= auction.CurrentPrice)
    return BadRequest("Bid must be higher than current price");

// 409 Conflict (Concurrency issue)
catch (DbUpdateConcurrencyException)
    return Conflict(new { message = "Someone already placed a higher bid" });
```

---

## 🧪 Testing Tips

1. **Test concurrent bids:**
   - Open auction in 2 browser tabs
   - Place bids simultaneously
   - See who wins with concurrency check

2. **Test real-time updates:**
   - Open auction in multiple tabs
   - Place bid in one tab
   - See instant update in other tabs

3. **Test timer:**
   - Create auction ending in 1 minute
   - Watch countdown update every second

4. **Test error handling:**
   - Bid lower than current price
   - Bid on closed auction
   - Simulate network disconnect

---

## 🔮 Future Improvements

- 👤 **User Authentication** - Login per user, track bid history
- 🏷️ **Categories** - Filter auctions by category
- 📜 **Bid History** - Show all bids for an auction
- ⏰ **Auto-close** - Background service to close expired auctions
- 🔔 **Notifications** - Email alerts for auction status
- 📊 **Admin Dashboard** - Analytics and auction management
- 💬 **Comments** - Users discuss auctions
- ⭐ **Ratings** - User reputation system

---

## 📚 Learning Resources

- [Angular Documentation](https://angular.io/docs)
- [ASP.NET Core Documentation](https://learn.microsoft.com/en-us/aspnet/core)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core)
- [SignalR Documentation](https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction)
- [RxJS Operators](https://rxjs.dev/)

---

## 📄 License

MIT License - Feel free to use this project for learning!

---

**Good luck with your project! 🚀**
