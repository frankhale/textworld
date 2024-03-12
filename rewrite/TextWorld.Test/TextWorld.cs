using TextWorld.Engine;

namespace TextWorld.Test
{
  public class TextWorld
  {
    #region PLAYER
    [Fact]
    public void CanCreatePlayer()
    {
      var textWorld = new TextWorldX();
      var result = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      Assert.NotNull(result);
      Assert.Equal("Player", result.Name);
    }

    [Fact]
    public void CanGetPlayer()
    {
      var textWorld = new TextWorldX();
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      var result = textWorld.GetPlayer(player.Id);
      Assert.NotNull(result);
      Assert.Equal("Player", result.Name);
    }

    [Fact]
    public void CanRemovePlayer()
    {
      var textWorld = new TextWorldX();
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      textWorld.RemovePlayer(player.Id);
      var result = textWorld.GetPlayer(player.Id);
      Assert.Null(result);
    }

    [Fact]
    public void CanResurrectPlayer()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      textWorld.SetRoomAsZoneStarter("Zone1", "Room1"); 
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      player.Stats.Value.Health.Current = 0;
      player.Stats.Value.Stamina.Current = 0;
      player.Stats.Value.Magicka.Current = 0;
      var result = textWorld.ResurrectPlayer(player);
      Assert.Equal("You have been resurrected.", result);
      Assert.Equal(player.Stats.Value.Health.Max, player.Stats.Value.Health.Current);
      Assert.Equal(player.Stats.Value.Stamina.Max, player.Stats.Value.Stamina.Current);
      Assert.Equal(player.Stats.Value.Magicka.Max, player.Stats.Value.Magicka.Current);
    }

    [Fact]
    public void CanGetPlayersZone()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      var result = textWorld.GetPlayersZone(player);
      Assert.NotNull(result);
      Assert.Equal("Zone1", result.Name);
    }

    [Fact]
    public void CanGetPlayersRoom()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      var result = textWorld.GetPlayersRoom(player);
      Assert.NotNull(result);
      Assert.Equal("Room1", result.Name);
    }

    [Fact]
    public void CanLookSelf()
    {
      var textWorld = new TextWorldX();
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      var result = textWorld.LookSelf(player);
      Assert.Equal("You are a strong adventurer", result);
    }
    #endregion

    #region ZONE
    [Fact]
    public void CanCreateZone()
    {
      var textWorld = new TextWorldX();
      var result = textWorld.CreateZone("Zone1", "The first zone");
      Assert.NotNull(result);
      Assert.Equal("Zone1", result.Name);
    }

    [Fact]
    public void CanGetZone()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      var result = textWorld.GetZone("Zone1");
      Assert.NotNull(result);
      Assert.Equal("Zone1", result.Name);
    }

    [Fact]
    public void CanRemoveZone()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.RemoveZone("Zone1");
      var result = textWorld.GetZone("Zone1");
      Assert.Null(result);
    }
    #endregion

    #region ROOM
    [Fact]
    public void CanCreateRoom()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      var result = textWorld.CreateRoom("Zone1", "Room1", "The first room");
      Assert.NotNull(result);
      Assert.Equal("Room1", result.Name);
    }

    [Fact]
    public void CanSetRoomAsZoneStarter()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      textWorld.SetRoomAsZoneStarter("Zone1", "Room1");
      var result = textWorld.GetZoneStartRoom("Zone1");
      Assert.NotNull(result);
      Assert.Equal("Room1", result.Name);
    }

    [Fact]
    public void CanGetZoneStartRoom()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      textWorld.SetRoomAsZoneStarter("Zone1", "Room1");
      var result = textWorld.GetZoneStartRoom("Zone1");
      Assert.NotNull(result);
      Assert.Equal("Room1", result.Name);
    }

    [Fact]
    public void CanGetRoom()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      var result = textWorld.GetRoom("Zone1", "Room1");
      Assert.NotNull(result);
      Assert.Equal("Room1", result.Name);
    }

    [Fact]
    public void CanCreateAlternateRoomDescription()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "This is room 1");
      textWorld.AddRoomDescription("Zone1", "Room1", "Room1-Alt", "This is room 1, again!");
      var result = textWorld.GetRoom("Zone1", "Room1");
      Assert.NotNull(result);
      Assert.Equal("Room1", result.Name);
      Assert.Equal("This is room 1, again!", result.Descriptions[1].Value);
    }

    [Fact]
    public void CanShowAlternateRoomDescription()
    {
      var textWorld = new TextWorldX();
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      textWorld.SetFlag(player, "Room1-Alt");
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "This is room 1");
      textWorld.AddRoomDescription("Zone1", "Room1", "Room1-Alt", "This is room 1, again!");
      var result = textWorld.GetRoomDescription(player);
      Assert.Equal("Location: This is room 1, again!", result);
    }

    [Fact]
    public void CanShowAlternateRoomDescriptionAndSwitchToDefault()
    {
      var textWorld = new TextWorldX();
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      textWorld.SetFlag(player, "Room1-Alt");
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "This is room 1");
      textWorld.AddRoomDescription("Zone1", "Room1", "Room1-Alt", "This is room 1, again!");
      var result = textWorld.GetRoomDescription(player);
      Assert.Equal("Location: This is room 1, again!", result);
      textWorld.RemoveFlag(player, "Room1-Alt");
      result = textWorld.GetRoomDescription(player);
      Assert.Equal("Location: This is room 1", result);
    }

    [Fact]
    public void CanRemoveRoom()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      textWorld.RemoveRoom("Zone1", "Room1");
      var result = textWorld.GetRoom("Zone1", "Room1");
      Assert.Null(result);
    }

    [Fact]
    public void CanCreateExit()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      textWorld.CreateRoom("Zone1", "Room2", "The second room");
      textWorld.CreateExit("Zone1", "Room1", "Room2", "north");
      var result = textWorld.GetExit("Zone1", "Room1", "north");
      Assert.NotNull(result);
      Assert.Equal("Room2", result.Location);
    }

    [Fact]
    public void CanRemoveExit()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      textWorld.CreateRoom("Zone1", "Room2", "The second room");
      textWorld.CreateExit("Zone1", "Room1", "Room2", "north");
      textWorld.RemoveExit("Zone1", "Room1", "north");
      var result = textWorld.GetExit("Zone1", "Room1", "north");
      Assert.Null(result);
    }

    [Fact]
    public void CanCreateRoomWithAction()
    {
      var textWorld = new TextWorldX();
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      textWorld.CreateZone("Zone1", "The first zone");
      textWorld.CreateRoom("Zone1", "Room1", "The first room");
      textWorld.CreateRoom("Zone1", "Room2", "The second room", (player) => { return "The healing waters have no effect on you."; });
      textWorld.CreateExit("Zone1", "Room1", "Room2", "North");
      var result = textWorld.SwitchRoom(player, "North");
      Assert.Equal("The healing waters have no effect on you.", result);
    } 
    #endregion

    #region QUEST
    [Fact]
    public void CanCreateQuest()
    {
      var textWorld = new TextWorldX();
      var result = textWorld.CreateQuest("Quest1", "The first quest");
      Assert.NotNull(result);
      Assert.Equal("Quest1", result.Name);
    }

    [Fact]
    public void CanGetQuest()
    {
      var textWorld = new TextWorldX();
      textWorld.CreateQuest("Quest1", "The first quest");
      var result = textWorld.GetQuest("Quest1");
      Assert.NotNull(result);
      Assert.Equal("Quest1", result.Name);
    }

    [Fact]
    public void CanAddQuestStepToQuest()
    {
      var textWorld = new TextWorldX();
      var quest = textWorld.CreateQuest("Quest1", "The first quest");
      textWorld.AddQuestStep(quest.Name, "Step1", "The first step");
      var result = textWorld.GetQuestStep(quest.Name, "Step1");
      Assert.NotNull(result);
      Assert.Equal("Step1", result.Name);
    }

    [Fact]
    public void CanAddQuestStepToQuestWithAction()
    {
      var textWorld = new TextWorldX();
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      var quest = textWorld.CreateQuest("Quest1", "The first quest");
      textWorld.AddQuestStep(quest.Name, "Step1", "The first step", (player) => { return true; });
      var result = textWorld.GetQuestStep(quest.Name, "Step1");
      var action = textWorld.GetQuestStepAction(quest.Name, result.Name);
      Assert.NotNull(result);
      Assert.Equal("Step1", result.Name);
      Assert.NotNull(action);
    }

    [Fact]
    public void CanGetQuestStep()
    {
      var textWorld = new TextWorldX();
      var quest = textWorld.CreateQuest("Quest1", "The first quest");
      textWorld.AddQuestStep(quest.Name, "Step1", "The first step");
      var result = textWorld.GetQuestStep(quest.Name, "Step1");
      Assert.NotNull(result);
      Assert.Equal("Step1", result.Name);
    }

    [Fact]
    public void CanAddQuestActionToQuest()
    {
      var textWorld = new TextWorldX();
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      var quest = textWorld.CreateQuest("Quest1", "The first quest");
      textWorld.AddQuestAction(quest.Name, "QuestAction", "The first action", (player) => { return "quest"; }, null);
      var result = textWorld.GetQuestAction("QuestAction");
      Assert.NotNull(result);
      Assert.Equal("QuestAction", result.Name);
    }

    [Fact]
    public void CanGetQuestAction()
    {
      var textWorld = new TextWorldX();
      var quest = textWorld.CreateQuest("Quest1", "The first quest");
      textWorld.AddQuestAction(quest.Name, "QuestAction", "The first action", (player) => { return "quest"; }, null);
      var result = textWorld.GetQuestAction("QuestAction");
      Assert.NotNull(result);
      Assert.Equal("QuestAction", result.Name);
    }

    [Fact]
    public void CanGetQuestStepAction()
    {
      var textWorld = new TextWorldX();
      var quest = textWorld.CreateQuest("Quest1", "The first quest");
      textWorld.AddQuestStep(quest.Name, "Step1", "The first step", (player) => { return true; });
      var result = textWorld.GetQuestStepAction(quest.Name, "Step1");
      Assert.NotNull(result);
      Assert.Equal("Step1", result.Name);
    }

    [Fact]
    public void CanPickupQuest()
    {
      var textWorld = new TextWorldX();
      var player = textWorld.CreatePlayer("Player", "You are a strong adventurer", "Zone1", "Room1");
      var quest = textWorld.CreateQuest("Quest1", "The first quest");
      var result = textWorld.PickupQuest(player, quest.Name);
      Assert.Equal($"You have picked up the quest Quest1.", result);
    }
    #endregion
  }
}