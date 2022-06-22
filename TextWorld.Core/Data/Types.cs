using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Data
{
    public class Currency
    {
        public int Coins { get; set; }
    }

    public class Health
    {
        public int CurrentHealth { get; set; }
        public int MaxHealth { get; set; }
    }

    public class Inventory
    {
        public string Id { get; set; }
        public int Quantity { get; set; }
    }

    public class Player
    {
        // TODO: Add an Id field here
        public string? Description { get; set; }
        public Currency? Currency { get; set; }
        public Health? Health { get; set; }
        public List<Inventory>? Inventory { get; set; }
        public string? CurrentRoom { get; set; }
    }

    public class Item
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public ItemType ItemType { get; set; }
        public string[]? Synonyms { get; set; }
        public string? AttributesJSON { get; set; }
        public bool IsContainer { get; set; }
    }

    public class ItemDrop
    {
        public string? Id { get; set; }
        public int Quantity { get; set; }
    }

    public class Exit
    {
        public Direction Direction { get; set; }
        public string? RoomId { get; set; }
        public bool Hidden { get; set; }
    }

    public class Room
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public List<Exit>? Exits { get; set; }
        public List<ItemDrop>? Items { get; set; }
    }

    public class Game
    {
        public string? MOTD { get; set; }
        public Player? Player { get; set; }        
        public List<Item>? Items { get; set; }
        public List<Room>? Rooms { get; set; }
    }

    public class GameEntities
    {
        
        public TWEntity? MOTD { get; set; }
        public TWEntity? Player { get; set; }
        public List<TWEntity>? Rooms { get; set; }
        public List<TWEntity>? Items { get; set; }
    }
}
