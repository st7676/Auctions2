using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.SignalR;
using backend.Hubs;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuctionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<AuctionHub> _hub;

        public AuctionsController(AppDbContext context, IHubContext<AuctionHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // GET: api/auctions
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var auctions = await _context.Auctions.ToListAsync();
            return Ok(auctions);
        }

        // POST: api/auctions
        [HttpPost]
        public async Task<IActionResult> Create(Auction auction)
        {
            _context.Auctions.Add(auction);
            await _context.SaveChangesAsync();
            return Ok(auction);
        }


        [HttpPost("{id}/bid")]
        public async Task<IActionResult> PlaceBid(int id, BidRequest request)
        {
            var auction = await _context.Auctions.FindAsync(id);

            if (auction == null)
                return NotFound();

            if (auction.IsClosed)
                return BadRequest("Auction is closed");

            if (request.Amount <= auction.CurrentPrice)
                return BadRequest("Bid must be higher than current price");

            // עדכון מחיר
            try
            {
                auction.CurrentPrice = request.Amount;

                _context.Bids.Add(new Bid
                {
                    AuctionId = id,
                    Amount = request.Amount,
                    CreatedAt = DateTime.UtcNow
                });
                _context.Entry(auction).Property(a => a.RowVersion).OriginalValue = request.RowVersion;

                await _context.SaveChangesAsync();

            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new
                {
                    message = "Someone already placed a higher bid"
                });
            }

            await _hub.Clients.All.SendAsync("BidUpdated", new
            {
                id = auction.Id,
                currentPrice = auction.CurrentPrice,
                rowVersion = auction.RowVersion
            });
            Console.WriteLine("Broadcasting BidUpdated");

            return Ok(new
            {
                message = "Bid accepted",
                newPrice = auction.CurrentPrice,
                rowVersion = auction.RowVersion
            });
        }
    }
}
