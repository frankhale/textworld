namespace TextWorld.Core.Data
{
    public class Room
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }        
    }
}
