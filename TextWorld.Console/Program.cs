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

MOTDEntity.AddComponent(new DescriptionComponent("motd description", "This is the very beginning of a text adventure game based on a custom entity component system. There isn't a whole lot here just yet. Sit back, buckle your seat belt folks. The ride is just beginning!!!"));

var streamId = Guid.NewGuid();
var openFieldId = Guid.NewGuid();
var largeRockId = Guid.NewGuid();

RoomEntities = new List<TWEntity>()
{
    new(streamId, "Stream", new()
    {
        new DisplayNameComponent("shallow stream display name", "Shallow Stream"),
        new DescriptionComponent("shallow stream description", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep. There is quite a large rock to your east."),
        new ExitComponent("shallow stream exit south", Direction.South, openFieldId),
        new ExitComponent("shallow stream exit east", Direction.East, largeRockId)
    }),
    new (openFieldId, "Open Field", new()
    {
        new ItemComponent("leather coin purse item", new CoinPurse("leather coin purse", 32, 1)),
        new ItemComponent("health potion item", new HealthPotion("health potion", 50, 10)),
        new DisplayNameComponent("open field display name", "Open Field"),
        new DescriptionComponent("open field description", "You are standing in an open field. All around you stands vibrant green grass. You can hear a running water to your north which you suspect is a small stream."),
        new ExitComponent("open field exit", Direction.North, streamId)
    }),
    new (largeRockId, "Large Rock", new() {
        new DisplayNameComponent("large rock display name", "Large Rock"),
        new DescriptionComponent("large rock description", "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings."),
        new ExitComponent("large rock exit", Direction.West, streamId)
    })
};

PlayerEntity.AddComponent(new DescriptionComponent("player description", "You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!"));
PlayerEntity.AddComponent(new InventoryComponent("player inventory"));
PlayerEntity.AddComponent(new CurrencyComponent("player currency"));
PlayerEntity.AddComponent(new IdComponent("player current room", openFieldId));

var firstRoom = RoomEntities.FirstOrDefault(room => room.Id == openFieldId);
if (firstRoom != null)
{
    PlayerEntity.AddComponent(new ShowDescriptionComponent("show current room description", firstRoom));
}

MOTDSystem.Run(MOTDEntity, OutputEntity);

while (true)
{
    CommandSystem.Run(CommandEntity, PlayerEntity, RoomEntities, PlayerEntity);
    ConsoleQuitSystem.Run(PlayerEntity, () =>
    {
        Console.WriteLine("Goodbye!");
        Environment.Exit(0);
    });
    RoomMovementSystem.Run(CommandEntity, PlayerEntity, RoomEntities, OutputEntity);
    RoomDescriptionSystem.Run(PlayerEntity, RoomEntities, OutputEntity);
    ItemsSystem.Run(PlayerEntity, RoomEntities, OutputEntity);
    InventorySystem.Run(CommandEntity, PlayerEntity, OutputEntity);
    UnknownCommandSystem.Run(CommandEntity, OutputEntity);
    ConsoleOutputSystem.Run(OutputEntity);
    ConsoleInputSystem.Run(CommandEntity);
}