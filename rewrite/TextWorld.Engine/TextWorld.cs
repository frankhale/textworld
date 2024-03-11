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

    public static string? GetDescription(Player player, Entity entity, string flag)
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

    public static string LookSelf(Player player)
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
    public Room CreateRoom(string zoneName, string name, string description)
    {
      var zone = GetZone(zoneName);
      if (zone != null)
      {
        var room = new Room(name, description);
        zone.Rooms.Add(room);
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
  }
}
