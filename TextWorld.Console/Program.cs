using TextWorld.Core.Components;
using TextWorld.Core.Data;
using TextWorld.Core.Misc;
using TextWorld.Core.Systems;

var gameLoader = new GameLoader();
if (gameLoader.Load("game.json"))
{
    // Systems
    MOTDSystem motdSystem = new();
    CommandSystem commandSystem = new();
    UnknownCommandSystem unknownCommandSystem = new();
    RoomDescriptionSystem roomDescriptionSystem = new();
    RoomMovementSystem roomMovementSystem = new();
    ItemSystem itemsSystem = new();
    InventorySystem inventorySystem = new();
    ConsoleInputSystem consoleInputSystem = new();
    ConsoleOutputSystem consoleOutputSystem = new();
    QuitSystem consoleQuitSystem = new();

    // Entities
    var gameEntities = gameLoader.GetGameEntities();
    var rooms = gameEntities.GetEntitiesByName("rooms");
    var player = gameEntities.GetEntityByName("players", "player");

    // Get the room the player is currently in and add a show description component so that
    // the room description is shown when the game starts. This probably should be done by
    // the room description system instead of being done here.
    var playerCurrentRoomComponent = player!.GetComponentByType<IdComponent>();
    var firstRoom = rooms!.FirstOrDefault(room => room.Id == playerCurrentRoomComponent!.Id);
    player.AddComponent(new ShowDescriptionComponent("show current room description", firstRoom!, DescriptionType.Room));
    player.AddComponent(Helper.GetRoomExitInfoForRoom(player, rooms!, firstRoom!));

    // Run systems
    motdSystem.Run(gameEntities);

    while (true)
    {
        commandSystem.Run(gameEntities);
        consoleQuitSystem.Run(gameEntities, () => { Console.WriteLine("Goodbye!"); Environment.Exit(0); });
        roomMovementSystem.Run(gameEntities);
        roomDescriptionSystem.Run(gameEntities);
        itemsSystem.Run(gameEntities);
        inventorySystem.Run(gameEntities);
        unknownCommandSystem.Run(gameEntities);
        consoleOutputSystem.Run(gameEntities);
        consoleInputSystem.Run(gameEntities);
    }
}