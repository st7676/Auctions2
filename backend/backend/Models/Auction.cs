using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Auction
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public decimal CurrentPrice { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsClosed { get; set; }
        
        [Timestamp]
        public byte[]? RowVersion { get; set; }
    }
}
