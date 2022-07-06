using TextWorld.Core.Data;
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