namespace TextWorld.Engine
{
  public delegate string? Action(Player player);
  public delegate void ActionNoOutput(Player player);
  public delegate bool ActionDecision(Player player);
  public delegate Task<string> CommandParserAction(Player player, string input, string command, string[] args);
  public delegate void SpawnLocationAction(SpawnLocation spawnLocation);

  #region ON HOLD
  //public class InnateCharacteristics
  //{
  //    public int Dexterity { get; set; }
  //    public int Constitution { get; set; }
  //    public int Intelligence { get; set; }
  //    public int Wisdom { get; set; }
  //    public int Charisma { get; set; }
  //}

  //public class Race
  //{
  //    public required string Name { get; set; }
  //    public required InnateCharacteristics InnateCharacteristics { get; set; }
  //}

  //public class PlayerProgress(Player player, World world)
  //{
  //    public Player Player { get; set; } = player;
  //    public World World { get; set; } = world;
  //}
  #endregion

  public class Description(string flag, string value)
  {
    public string Flag { get; set; } = flag;
    public string Value { get; set; } = value;
  }

  public abstract class Entity(string name, string description)
  {
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = name;
    public List<Description> Descriptions { get; set; } = [new("default", description)];
  }

  public class ItemDrop
  {
    public required string Name { get; set; }
    public int Quantity { get; set; }
  }

  public class Storage
  {
    public List<ItemDrop> Items { get; set; } = [];
  }

  public class Stat
  {
    public int Current { get; set; }
    public int Max { get; set; }
  }

  public class Resources
  {
    public required Stat Health { get; set; }
    public required Stat Stamina { get; set; }
    public required Stat Magicka { get; set; }
  }
  public class Level
  {
    public int Value { get; set; }
    public double XP { get; set; }
  }

  public class Recipe(string name, string description, ItemDrop craftedItem) : Entity(name, description)
  {
    public List<ItemDrop> Ingredients { get; set; } = [];
    public ItemDrop CraftedItem { get; set; } = craftedItem;
  }

  public class Item(string name, string description, bool usable) : Entity(name, description)
  {
    public bool Usable { get; set; } = usable;
  }

  public class Exit(string name, string description, string location) : Entity(name, description)
  {
    public string Location { get; set; } = location;
    public bool Hidden { get; set; } = false;
  }

  public class Room(string name, string description) : Entity(name, description)
  {
    public Storage Storage { get; set; } = new();
    public bool ZoneStart { get; set; }
    public List<NPC> Npcs { get; set; } = [];
    public List<Exit> Exits { get; set; } = [];
    public List<Mob> Mobs { get; set; } = [];
    public List<RoomObject> Objects { get; set; } = [];
  }

  public class Zone(string name, string description) : Entity(name, description)
  {
    public List<Room> Rooms { get; set; } = [];
  }

  public class Stats
  {
    public required Resources Value { get; set; }
    public required DamageAndDefense DamageAndDefense { get; set; }
  }

  public class Dialog(string name, string description, string response) : Entity(name, description)
  {
    public List<string> Trigger { get; set; } = [];
    public string Response { get; set; } = response;
  }

  public class NPC(string name, string description) : Entity(name, description)
  {
    public Stats Stats { get; set; } = new()
    {
      Value = new()
      {
        Health = new() { Current = 10, Max = 10 },
        Stamina = new() { Current = 10, Max = 10 },
        Magicka = new() { Current = 10, Max = 10 }
      },
      DamageAndDefense = new()
      {
        PhysicalDamage = 1,
        PhysicalDefense = 1,
        SpellDamage = 1,
        SpellDefense = 1,
        CriticalChance = 0.1
      }
    };
    public List<string> Inventory { get; set; } = [];
    public List<Dialog> Dialog { get; set; } = [];
    public bool Killable { get; set; }
    public List<VendorItem> VendorItems { get; set; } = [];
  }

  public class VendorItem(string name, string description, int price) : Entity(name, description)
  {
    public int Price { get; set; } = price;
  }

  public class DamageAndDefense
  {
    public int PhysicalDamage { get; set; }
    public int PhysicalDefense { get; set; }
    public int SpellDamage { get; set; }
    public int SpellDefense { get; set; }
    public double CriticalChance { get; set; }
  }

  public class Mob(string name, string description) : Entity(name, description)
  {
    public Stats Stats { get; set; } = new()
    {
      Value = new()
      {
        Health = new() { Current = 1, Max = 1 },
        Stamina = new() { Current = 1, Max = 1 },
        Magicka = new() { Current = 1, Max = 1 }
      },
      DamageAndDefense = new()
      {
        PhysicalDamage = 1,
        PhysicalDefense = 1,
        SpellDamage = 1,
        SpellDefense = 1,
        CriticalChance = 0.1
      }
    };
    public Storage Storage { get; set; } = new();
  }

  public class RoomObject(string name, string description) : Entity(name, description)
  {
    public List<Dialog> Dialog { get; set; } = [];
    public List<string> Inventory { get; set; } = [];
  }

  public class QuestStep(string name, string description) : Entity(name, description)
  {
    public bool Complete { get; set; } = false;
  }

  public class Quest(string name, string description) : Entity(name, description)
  {
    public bool Complete { get; set; } = false;
    public List<QuestStep> Steps { get; set; } = [];
  }

  public class SpawnLocation(string name, string description, string zoneName, string roomName) : Entity(name, description)
  {
    public string ZoneName { get; set; } = zoneName;
    public string RoomName { get; set; } = roomName;
    public bool Active { get; set; } = false;
    public int Interval { get; set; }    
    public Timer? Timer { get; set; }
    public SpawnLocationAction? Action { get; set; }
  }

  public class Player(string name, string description, string zoneName, string roomName) : Entity(name, description)
  {
    //public required Race Race { get; set; }
    public Stats Stats { get; set; } = new() 
    { 
      Value = new() { 
        Health = new() { Current = 10, Max = 10 }, 
        Stamina = new() { Current = 10, Max = 10 }, 
        Magicka = new() { Current = 10, Max = 10 } }, 
      DamageAndDefense = new() { 
        PhysicalDamage = 1, 
        PhysicalDefense = 110, 
        SpellDamage = 1, 
        SpellDefense = 1, 
        CriticalChance = 0.1 } 
    };
    public Storage Storage { get; set; } = new();
    public int Score { get; set; }
    public int Gold { get; set; }
    public Level Progress { get; set; } = new() { Value = 1, XP = 0 };
    public string ZoneName { get; set; } = zoneName;
    public string RoomName { get; set; } = roomName;
    public List<string> Flags { get; set; } = [];
    public List<string> KnownRecipes { get; set; } = [];
    public List<string> Quests { get; set; } = [];
    public List<string> QuestsCompleted { get; set; } = [];
  }

  public class World
  {    
    public List<Zone> Zones { get; set; } = [];
    public List<Item> Items { get; set; } = [];
    public List<Recipe> Recipes { get; set; } = [];
    public List<NPC> Npcs { get; set; } = [];
    public List<Mob> Mobs { get; set; } = [];
    public List<Player> Players { get; set; } = [];
    public List<Quest> Quests { get; set; } = [];
    public List<Level> LevelData { get; set; } = [];
  }

  #region ACTIONS
  public class QuestAction(string name, string description, Action? start, Action? end) : Entity(name, description)
  {
    public Action? Start { get; set; } = start;
    public Action? End { get; set; } = end;
  }

  public class QuestStepAction(string name, string description, ActionDecision action) : Entity(name, description)
  {
    public ActionDecision Action { get; set; } = action;
  }

  public class DialogAction(string name, string description, List<string> triggers, CommandParserAction action) : Entity(name, description)
  {
    public List<string> Triggers { get; set; } = triggers;
    public required CommandParserAction Action { get; set; } = action;
  }

  public class ItemAction(string name, string description, Action action) : Entity(name, description)
  {
    public required Action Action { get; set; } = action;
  }

  public class RoomAction(string name, string description, Action action) : Entity(name, description)
  {
    public Action Action { get; set; } = action;
  }

  public class CommandAction(string name, string description) : Entity(name, description)
  {
    public List<string> Synonyms { get; set; } = [];
    public required CommandParserAction Action { get; set; }
  }

  public class RoomCommandActions(string name, string description) : Entity(name, description)
  {
    public List<CommandAction> CommandActions { get; set; } = [];
  }

  public class WorldActions
  {
    public List<SpawnLocation> SpawnLocations { get; set; } = [];
    public List<DialogAction> DialogActions { get; set; } = [];
    public List<ItemAction> ItemActions { get; set; } = [];
    public List<RoomAction> RoomActions { get; set; } = [];
    public List<RoomCommandActions> RoomCommandActions { get; set; } = [];
    public List<QuestAction> QuestActions { get; set; } = [];
    public List<QuestStepAction> QuestStepActions { get; set; } = [];
  }
  #endregion
}
