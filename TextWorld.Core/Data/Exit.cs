namespace TextWorld.Core.Data
{
    public class Exit
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public string? Direction { get; set; }
        public bool Hidden { get; set; }
    }
}
