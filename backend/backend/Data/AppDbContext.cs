
    using Microsoft.EntityFrameworkCore;
    using System.Collections.Generic;
    using backend.Models;

namespace backend.Data
{


    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Auction> Auctions { get; set; }
        public DbSet<Bid> Bids { get; set; }
    }
}
