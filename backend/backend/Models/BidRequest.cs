namespace backend.Models
{
    public class BidRequest
    {
        public decimal Amount { get; set; }
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    }
}
