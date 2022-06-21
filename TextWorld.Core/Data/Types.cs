namespace TextWorld.Core.Data
{
    public class Currency
    {
        public int Coins { get; set; }
    }

    public class Health
    {
        public int Current { get; set; }
        public int Max { get; set; }
    }

    public class Inventory
    {
        public int Id { get; set; }
        public int Quantity { get; set; }
    }

    public class Player
    {
        public string? Description { get; set; }
        public Currency? Currency { get; set; }
        public Health? Health { get; set; }
        public List<Inventory>? Inventory { get; set; }
        public int CurrentRoom { get; set; }
    }

    public enum ItemType
    {
        CoinPurse,
        Potion,
        Sword,
        Lamp
    }

    public class Item
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public ItemType ItemType { get; set; }
        public string? AttributesJSON { get; set; }
    }

    public class ItemDrop
    {
        public int Id { get; set; }
        public int Quantity { get; set; }
    }

    public class Exits
    {
        public string? North { get; set; }
        public string? South { get; set; }
        public string? East { get; set; }
        public string? West { get; set; }
    }

    public class Room
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public Exits? Exits { get; set; }
        public List<ItemDrop>? Items { get; set; }
    }

    public class Game
    {
        public Player? Player { get; set; }        
        public List<Item>? Items { get; set; }
        public List<Room>? Rooms { get; set; }
    }
}
