using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Items;
using TextWorld.Core.Misc;
using TextWorld.Core.Systems;

// Entities
TWEntity MOTDEntity = new("MOTD Entity");
TWEntity PlayerEntity = new("Player Entity");
TWEntity CommandEntity = new("Command Entity");
TWEntity OutputEntity = new("Output Entity");
List<TWEntity> RoomEntities = new();
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

MOTDEntity.AddComponent(new DescriptionComponent("motd description", "Welcome to a text adventure written using an entity component system based engine called TextWorld. Look around, have fun!"));

Guid streamId = Guid.NewGuid(),
    openFieldId = Guid.NewGuid(),
    largeRockId = Guid.NewGuid(),
    oldForestId = Guid.NewGuid(),
    coinId = Guid.NewGuid(),
    healthPotionId = Guid.NewGuid();

RoomEntities = new List<TWEntity>()
{
    new (openFieldId, "Open Field", new()
    {
        new ItemComponent("leather coin purse item", new CoinPurse(coinId, "leather coin purse", 32, 1)),
        new ItemComponent("health potion item", new HealthPotion(healthPotionId, "health potion", 50, 10)),
        new DisplayNameComponent("open field display name", "Open Field"),
        new DescriptionComponent("open field description", "You are standing in an open field. All around you stands vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream."),
        new ExitComponent("open field exit", Direction.North, streamId, false)
    }),
    new(streamId, "Stream", new()
    {
        new DisplayNameComponent("shallow stream display name", "Shallow Stream"),
        new DescriptionComponent("shallow stream description", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing."),
        new ExitComponent("shallow stream exit south", Direction.South, openFieldId, false),
        new ExitComponent("shallow stream exit east", Direction.East, largeRockId, false)
    }),
    new (largeRockId, "Large Rock", new() 
    {
        new ItemComponent("health potion item", new HealthPotion(healthPotionId, "health potion", 50, 3)),
        new DisplayNameComponent("large rock display name", "Large Rock"),
        new DescriptionComponent("large rock description", "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings."),
        new ExitComponent("large rock exit west", Direction.West, streamId, false),
        new ExitComponent("large rock exit east", Direction.East, oldForestId, false)
    }),
    new (oldForestId, "Old Forest", new() 
    {
        new DisplayNameComponent("The old and wise forest", "Old Forest"),
        new DescriptionComponent("The old and wise forest description", "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction."),
        new ExitComponent("large rock exit", Direction.West, largeRockId, false)
    }),
};

PlayerEntity.AddComponent(new DescriptionComponent("player description", "You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!"));
PlayerEntity.AddComponent(new InventoryComponent("player inventory"));
PlayerEntity.AddComponent(new HealthComponent("player health", 100, 100));
PlayerEntity.AddComponent(new CurrencyComponent("player currency", 30));
PlayerEntity.AddComponent(new IdComponent("player current room", openFieldId));

var firstRoom = RoomEntities.FirstOrDefault(room => room.Id == openFieldId);
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
    ConsoleInputSystem.Run(CommandEntity, OutputEntity);
}