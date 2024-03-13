using System.Text;

namespace TextWorld.Engine
{
  public class TextWorldX
  {
    private readonly int activeQuestLimit = 5;
    private readonly int inputCharacterLimit = 256;
    private readonly World world = new();
    private readonly WorldActions worldActions = new();
    //private readonly List<CommandAction> mainCommandActions = [];
    //private readonly List<CommandAction> playerDeadCommandActions = [];

    public TextWorldX() { }

    public string? GetDescription(Player player, Entity entity, string flag)
    {
      if (flag == "default" && player.Flags.Count > 0)
      {
        var matchingDesc = player.Flags
                                 .Select(playerFlag => entity.Descriptions.FirstOrDefault(desc => desc.Flag == playerFlag))
                                 .FirstOrDefault(desc => desc != null);

        if (matchingDesc != null)
        {
          flag = matchingDesc.Flag;
        }
      }

      return entity.Descriptions.Find(desc => desc.Flag == flag)?.Value;
    }

    #region PLAYER
    public Player CreatePlayer(string name, string description, string zoneName, string roomName)
    {
      var player = new Player(name, description, zoneName, roomName);
      world.Players.Add(player);
      return player;
    }

    public void SetFlag(Player player, string flag)
    {
      if (!player.Flags.Contains(flag))
      {
        player.Flags.Add(flag);
      }
    }

    public void RemoveFlag(Player player, string flag)
    {
      player.Flags.Remove(flag);
    }

    public bool HasFlag(Player player, string flag)
    {
      return player.Flags.Contains(flag);
    }

    public string ResurrectPlayer(Player player)
    {
      player.Stats.Value.Health.Current = player.Stats.Value.Health.Max;
      player.Stats.Value.Stamina.Current = player.Stats.Value.Stamina.Max;
      player.Stats.Value.Magicka.Current = player.Stats.Value.Magicka.Max;
      SetPlayersRoomToZoneStart(player, player.ZoneName);
      return "You have been resurrected.";
    }

    public Player? GetPlayer(Guid id)
    {
      return world.Players.Find(p => p.Id == id);
    }

    public void RemovePlayer(Guid id)
    {
      world.Players.RemoveAll(p => p.Id == id);
    }

    public Zone GetPlayersZone(Player player)
    {
      var zone = world.Zones.Find(z => z.Name == player.ZoneName);

      if (zone != null)
      {
        return zone;
      }

      throw new Exception("Player is not in a zone.");
    }

    public Room GetPlayersRoom(Player player)
    {
      var zone = GetPlayersZone(player);

      if (zone != null)
      {
        var room = zone.Rooms.Find(r => r.Name == player.RoomName);

        if (room != null)
        {
          return room;
        }
      }

      throw new Exception("Player is not in a zone or room");
    }

    public string LookSelf(Player player)
    {
      string inventory = string.Join(", ", player.Storage.Items.Select(item => $"{item.Name} ({item.Quantity})"));
      return $"{GetDescription(player, player, "default")}" +
             $"{(player.Storage.Items.Count > 0 ? "\n\nInventory: " + inventory : "")}";
    }

    public void SetPlayersRoomToZoneStart(Player player, string zoneName)
    {
      var room = GetZoneStartRoom(zoneName);
      if (room != null)
      {
        player.ZoneName = zoneName;
        player.RoomName = room.Name;
      }
      else
      {
        throw new Exception($"Zone {zoneName} does not have a starter room.");
      }
    }

    public void SetPlayersRoom(Player player, string zoneName, string roomName)
    {
      throw new NotImplementedException();
    }
    #endregion

    #region ZONE
    public Zone CreateZone(string name, string description)
    {
      var zone = new Zone(name, description);
      world.Zones.Add(zone);
      return zone;
    }

    public Zone? GetZone(string zoneName)
    {
      return world.Zones.Find(z => z.Name == zoneName);
    }

    public void RemoveZone(string zoneName)
    {
      world.Zones.RemoveAll(z => z.Name == zoneName);
    }

    public Room? GetZoneStartRoom(string zoneName)
    {
      var zone = GetZone(zoneName);
      if (zone != null)
      {
        return zone.Rooms.Find(r => r.ZoneStart);
      }
      return null;
    }
    #endregion

    #region ROOM
    public Room CreateRoom(string zoneName, string name, string description, Action? action = null)
    {
      var zone = GetZone(zoneName);
      if (zone != null)
      {
        var room = new Room(name, description);
        zone.Rooms.Add(room);

        if (action != null)
        {
          worldActions.RoomActions.Add(new RoomAction(name, description, action));
        }
        return room;
      }
      throw new Exception($"Zone {zoneName} does not exist.");
    }

    public void SetRoomAsZoneStarter(string zoneName, string roomName)
    {
      var zone = GetZone(zoneName) ?? throw new Exception($"Zone {zoneName} does not exist.");
      var room = zone.Rooms.Find(r => r.Name == roomName) ?? throw new Exception($"Room {roomName} does not exist in zone {zoneName}."); ;

      room.ZoneStart = true;
    }

    public Room? GetRoom(string zoneName, string roomName)
    {
      var zone = GetZone(zoneName);
      if (zone != null)
      {
        return zone.Rooms.Find(r => r.Name == roomName);
      }
      return null;
    }

    public void AddRoomDescription(string zoneName, string roomName, string flag, string description)
    {
      var room = GetRoom(zoneName, roomName);
      if (room != null)
      {
        room.Descriptions.Add(new Description(flag, description));
      }
      else
      {
        throw new Exception($"Room {roomName} does not exist in zone {zoneName}.");
      }
    }

    public string GetRoomDescription(Player player)
    {
      var room = GetPlayersRoom(player);

      if (room != null)
      {
        List<string> exits = room.Exits.Select(x => x.Name).ToList();
        List<string> npcs = room.Npcs.Select(x => x.VendorItems.Count > 0 ? $"{x.Name} (Vendor)" : x.Name).ToList();

        return $"Location: {GetDescription(player, room, "default")}" +
               $"{(exits.Count > 0 ? "\n\nExits: " + string.Join(", ", exits) : "")}" +
               $"{(npcs.Count > 0 ? "\n\nNPCs: " + string.Join(", ", npcs) : "")}";
      }

      return "You can't see anything.";
    }

    public void RemoveRoom(string zoneName, string roomName)
    {
      var zone = GetZone(zoneName);
      zone?.Rooms.RemoveAll(r => r.Name == roomName);
    }

    public void CreateExit(string zoneName, string fromRoomName, string toRoomName, string exitName, bool hidden = false)
    {
      var zone = GetZone(zoneName);
      if (zone != null)
      {
        var fromRoom = zone.Rooms.Find(r => r.Name == fromRoomName);
        var toRoom = zone.Rooms.Find(r => r.Name == toRoomName);
        if (fromRoom != null && toRoom != null)
        {
          if (fromRoom != null && toRoom != null)
          {
            var oppositeExitName = "";
            switch (exitName)
            {
              case "north":
                oppositeExitName = "south";
                break;
              case "south":
                oppositeExitName = "north";
                break;
              case "east":
                oppositeExitName = "west";
                break;
              case "west":
                oppositeExitName = "east";
                break;
            }

            fromRoom.Exits.Add(new Exit(exitName, $"Exit {exitName}", toRoomName) { Hidden = hidden });
            toRoom.Exits.Add(new Exit(oppositeExitName, $"Exit {oppositeExitName}", fromRoomName) { Hidden = hidden });
          }
          else
          {
            throw new Exception($"Room {fromRoomName} or {toRoomName} does not exist in zone {zoneName}.");
          }
        }        
      }
      else
      {
        throw new Exception($"Zone {zoneName} does not exist.");
      }
    }

    public void RemoveExit(string zoneName, string fromRoomName, string exitName)
    {
      var zone = GetZone(zoneName);
      if (zone != null)
      {
        var fromRoom = zone.Rooms.Find(r => r.Name == fromRoomName);
        if (fromRoom != null)
        {
          fromRoom.Exits.RemoveAll(e => e.Name == exitName);
        }
        else
        {
          throw new Exception($"Room {fromRoomName} does not exist in zone {zoneName}.");
        }
      }
      else
      {
        throw new Exception($"Zone {zoneName} does not exist.");
      }
    }

    public Exit? GetExit(string zoneName, string fromRoomName, string exitName)
    {
      var room = GetRoom(zoneName, fromRoomName);
      if (room != null)
      {
        return room.Exits.Find(e => e.Name == exitName);
      }
      return null;
    }

    public string SwitchRoom(Player player, string exitName)
    {
      var room = GetPlayersRoom(player);
      var exit = room.Exits.Find(e => e.Name == exitName);
      if (exit != null)
      {
        if (exit.Hidden)
          exit.Hidden = false;

        player.RoomName = exit.Location;

        var roomDescription = GetRoomDescription(player);
        var roomActions = worldActions.RoomActions.FindAll(a => a.Name == player.RoomName);
        if (roomActions.Count > 0)
        {
          var actionResults = new StringBuilder();
          foreach (var action in roomActions)
          {
            var actionResult = action.Action(player);
            actionResults.AppendLine(actionResult);
          }

          if(actionResults.Length > 0)
          {
            return actionResults.ToString().Trim();
          }
        }

        return roomDescription;
      }
      return "You can't go that way.";
    }
    #endregion

    #region QUEST
    public Quest CreateQuest(string name, string description)
    {
      var quest = new Quest(name, description);
      world.Quests.Add(quest);
      return quest;
    }

    public Quest? GetQuest(string questName)
    {
      return world.Quests.Find(q => q.Name == questName) ?? null;
    }

    public void AddQuestStep(string questName, string stepName, string description, ActionDecision? action = null)
    {
      var quest = GetQuest(questName) ?? throw new Exception($"Quest {questName} does not exist.");
      var questStep = new QuestStep(stepName, description);
      quest.Steps.Add(questStep);
      if (action != null)
      {
        worldActions.QuestStepActions.Add(new QuestStepAction(stepName, description, action));
      }
    }

    public void AddQuestAction(string questName, string actionName, string description, Action? startAction, Action? endAction)
    {
      var quest = world.Quests.Find(q => q.Name == questName) ?? throw new Exception($"Quest {questName} does not exist.");
      var questAction = new QuestAction(actionName, description, startAction, endAction);

      worldActions.QuestActions.Add(questAction);
    }

    public QuestStep GetQuestStep(string questName, string stepName)
    {
      var quest = world.Quests.Find(q => q.Name == questName);
      if (quest != null)
      {
        var step = quest.Steps.Find(s => s.Name == stepName);
        if (step != null)
        {
          return step;
        }
      }
      throw new Exception($"Quest step {stepName} does not exist in quest {questName}.");
    }

    public QuestAction? GetQuestAction(string actionName)
    {
      return worldActions.QuestActions.Find(a => a.Name == actionName) ?? null;
    }

    public QuestStepAction? GetQuestStepAction(string questName, string stepName)
    {
      var questStep = GetQuestStep(questName, stepName);
      return worldActions.QuestStepActions.Find(a => a.Name == questStep.Name) ?? null;
    }

    public string PickupQuest(Player player, string questName)
    {
      if (player.Quests.Count >= activeQuestLimit)
        return $"You can't have more than {activeQuestLimit} active quests at a time.";

      var quest = GetQuest(questName);
      if (quest == null)
        return $"The quest {questName} does not exist.";

      if (player.Quests.Contains(questName))
        return $"You already have the quest {questName}.";

      var questAction = GetQuestAction(questName);
      if (questAction != null && questAction.Start != null)
      {
        var questActionResult = questAction.Start(player);
        player.Quests.Add(questName);
        return $"You have picked up the quest {questName}.\n\n{questActionResult}";
      }
      else
      {
        player.Quests.Add(questName);
        return $"You have picked up the quest {questName}.";
      }
    }
    #endregion

    #region RECIPE
    public void CreateRecipe(string name, string description, List<ItemDrop> ingredients, ItemDrop craftedItem)
    {
      world.Recipes.Add(new Recipe(name, description, ingredients, craftedItem));
    }

    public Recipe? GetRecipe(string recipeName)
    {
      return world.Recipes.Find(r => r.Name == recipeName) ?? null;
    }
    #endregion

    #region ITEM
    public Item CreateItem(string name, string description, bool usable = false, Action? action = null)
    {
      var item = new Item(name, description, usable);
      world.Items.Add(item);
      if (action != null)
      {
        worldActions.ItemActions.Add(new ItemAction(name, description, action));
      }
      return item;
    }

    public Item? GetItem(string itemName)
    {
      return world.Items.Find(i => i.Name == itemName) ?? null;
    }

    public Action? GetItemAction(string itemName)
    {
      var itemAction = worldActions.ItemActions.Find(a => a.Name == itemName);
      if (itemAction != null)
      {
        return itemAction.Action;
      }
      return null;
    }

    public void PlaceItem(string zoneName, string roomName, string itemName, int quantity)
    {
      var room = GetRoom(zoneName, roomName);
      if (room != null)
      {
        var item = GetItem(itemName);
        if (item != null)
        {
          room.Storage.Items.Add(new ItemDrop(item.Name, quantity));
        }
        else
        {
          throw new Exception($"Item {itemName} does not exist.");
        }
      }
      else
      {
        throw new Exception($"Room {roomName} does not exist in zone {zoneName}.");
      }
    }
    #endregion

    #region MOB
    public Mob CreateMob(string name, string description, Resources resources, DamageAndDefense damageAndDefense, List<ItemDrop> items)
    {       
      var mob = new Mob(name, description, resources, damageAndDefense, items);
      world.Mobs.Add(mob);
      return mob;
    }
    #endregion
  }
}
