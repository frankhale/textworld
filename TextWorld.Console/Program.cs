using TextWorld.Core.Components;
using TextWorld.Core.Data;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;
using TextWorld.Core.Systems;

var gameLoader = new GameLoader();
if (gameLoader.Load("game.json"))
{
    //Entities
    TWEntity motdEntity = new("MOTD Entity");
    TWEntity playerEntity = new("Player Entity");
    TWEntity commandEntity = new("Command Entity");
    TWEntity outputEntity = new("Output Entity");
    List<TWEntity> roomEntities = new();
    List<TWEntity> itemEntities = new();
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

    var gameEntities = gameLoader.GetGameEntities();

    motdEntity = gameEntities.MOTD!;
    playerEntity = gameEntities.Player!;
    roomEntities = gameEntities.Rooms!;
    itemEntities = gameEntities.Items!;

    var playerCurrentRoomComponent = playerEntity.GetComponentByType<IdComponent>();

    var firstRoom = roomEntities.FirstOrDefault(room => room.Id == playerCurrentRoomComponent!.Id);
    playerEntity.AddComponent(new ShowDescriptionComponent("show current room description", firstRoom!, DescriptionType.Room));
    playerEntity.AddComponent(Helper.GetRoomExitInfoForRoom(playerEntity, roomEntities, firstRoom!));

    // Run systems
    motdSystem.Run(motdEntity, outputEntity);

    while (true)
    {
        commandSystem.Run(commandEntity, playerEntity, roomEntities, playerEntity);
        consoleQuitSystem.Run(playerEntity, () => { Console.WriteLine("Goodbye!"); Environment.Exit(0); });
        roomMovementSystem.Run(commandEntity, playerEntity, roomEntities, outputEntity);
        roomDescriptionSystem.Run(playerEntity, roomEntities, outputEntity);
        itemsSystem.Run(playerEntity, itemEntities, roomEntities, outputEntity);
        inventorySystem.Run(commandEntity, playerEntity, outputEntity);
        unknownCommandSystem.Run(commandEntity, outputEntity);
        consoleOutputSystem.Run(outputEntity);
        consoleInputSystem.Run(playerEntity, commandEntity, outputEntity);
    }
}