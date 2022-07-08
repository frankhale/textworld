﻿using TextWorld.Core.ECS;
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


    public class ItemDrop
    {
        public int Id { get; set; }
        public int Quantity { get; set; }
    }

    public class Player
    {
        // TODO: Add an Id field here
        public string? Description { get; set; }
        public Currency? Currency { get; set; }
        public Health? Health { get; set; }
        public Stats? Stats { get; set; }
        public List<ItemDrop>? Inventory { get; set; }
        public string? CurrentRoom { get; set; }
    }

    public class ItemDefinition
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string[]? Synonyms { get; set; }
        public ItemType ItemType { get; set; }
        public string? AttributesJSON { get; set; }
        public bool IsContainer { get; set; }
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
        public List<ItemDefinition>? Items { get; set; }
        public List<Room>? Rooms { get; set; }
    }

    public class Stat
    {
        public int CurrentValue { get; set; }
        public int MaxValue { get; set; }
    }

    public class Stats
    {
        public Stat Health { get; set; } = new Stat();
        public Stat Magicka { get; set; } = new Stat();
        public Stat Stamina { get; set; } = new Stat();
    }

    public enum IdType
    {
        Room,
        Item,
        Player
    }

    public class InventoryItem
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public int Quantity { get; set; }
    }

    public enum ItemActionType
    {
        Show,
        ShowAll,
        Take,
        TakeAll,
        Drop,
        DropAll,
        Use
    }
    public enum ItemType
    {
        CoinPurse,
        HealthPotion,
        Sword,
        Lamp
    }

    public enum OutputType
    {
        MessageOfTheDay,
        Regular,
        Command,
        Separator
    }

    public record OutputItem(string Value, OutputType Type);

    public enum Direction
    {
        North,
        NorthEast,
        NorthWest,
        South,
        SouthEast,
        SouthWest,
        East,
        West,
        Up,
        Down
    }

    public enum DescriptionType
    {
        Room,
        Exit,
        Item
    }
}
