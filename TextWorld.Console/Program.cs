using TextWorld.Core.Components;
using TextWorld.Core.Data;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;
using TextWorld.Core.Systems;

var gameLoader = new GameLoader();
if (gameLoader.Load("game.json"))
{
    //Entities
    TWEntity MOTDEntity = new("MOTD Entity");
    TWEntity PlayerEntity = new("Player Entity");
    TWEntity CommandEntity = new("Command Entity");
    TWEntity OutputEntity = new("Output Entity");
    List<TWEntity> RoomEntities = new();
    List<TWEntity> ItemEntities = new();
    // Systems
    MOTDSystem MOTDSystem = new();
    CommandSystem CommandSystem = new();
    UnknownCommandSystem UnknownCommandSystem = new();
    RoomDescriptionSystem RoomDescriptionSystem = new();
    RoomMovementSystem RoomMovementSystem = new();
    ItemSystem ItemsSystem = new();
    InventorySystem InventorySystem = new();
    ConsoleInputSystem ConsoleInputSystem = new();
    ConsoleOutputSystem ConsoleOutputSystem = new();
    QuitSystem ConsoleQuitSystem = new();

    var gameEntities = gameLoader.GetGameEntities();

    MOTDEntity = gameEntities.MOTD!;
    PlayerEntity = gameEntities.Player!;
    RoomEntities = gameEntities.Rooms!;
    ItemEntities = gameEntities.Items!;

    var playerCurrentRoomComponent = PlayerEntity.GetComponentByType<IdComponent>();

    var firstRoom = RoomEntities.FirstOrDefault(room => room.Id == playerCurrentRoomComponent!.Id);
    PlayerEntity.AddComponent(new ShowDescriptionComponent("show current room description", firstRoom!, DescriptionType.Room));
    PlayerEntity.AddComponent(Helper.GetRoomExitInfoForRoom(PlayerEntity, RoomEntities, firstRoom!));

    // Run systems
    MOTDSystem.Run(MOTDEntity, OutputEntity);

    while (true)
    {
        CommandSystem.Run(CommandEntity, PlayerEntity, RoomEntities, PlayerEntity);
        ConsoleQuitSystem.Run(PlayerEntity, () => { Console.WriteLine("Goodbye!"); Environment.Exit(0); });
        RoomMovementSystem.Run(CommandEntity, PlayerEntity, RoomEntities, OutputEntity);
        RoomDescriptionSystem.Run(PlayerEntity, RoomEntities, OutputEntity);
        ItemsSystem.Run(PlayerEntity, RoomEntities, OutputEntity);
        InventorySystem.Run(CommandEntity, PlayerEntity, OutputEntity);
        UnknownCommandSystem.Run(CommandEntity, OutputEntity);
        ConsoleOutputSystem.Run(OutputEntity);
        ConsoleInputSystem.Run(PlayerEntity, CommandEntity, OutputEntity);
    }
}