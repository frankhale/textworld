using System;
using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.ECS;
using TextWorld.Core.Components;
using TextWorld.Core.Items;
using TextWorld.Core.Misc;
using TextWorld.Core.Systems;

namespace TextWorld.Game
{
    public class TextWorldGame
    {
        // Entities
        public TWEntity MOTDEntity { get; private set; } = new TWEntity("MOTD Entity");
        public TWEntity PlayerEntity { get; private set; } = new TWEntity("Player Entity");
        public TWEntity CommandEntity { get; private set; } = new TWEntity("Command Entity");
        public TWEntity OutputEntity { get; private set; } = new TWEntity("Output Entity");
        public List<TWEntity> RoomEntities { get; private set; } = new List<TWEntity>();
        // Systems
        public MOTDSystem MOTDSystem = new MOTDSystem();
        public CommandSystem CommandSystem = new CommandSystem();
        public UnknownCommandSystem UnknownCommandSystem = new UnknownCommandSystem();
        public RoomDescriptionSystem RoomDescriptionSystem = new RoomDescriptionSystem();
        public RoomMovementSystem RoomMovementSystem = new RoomMovementSystem();
        public ItemSystem ItemsSystem = new ItemSystem();

        public TextWorldGame()
        {
            MOTDEntity.AddComponent(new DescriptionComponent("motd description", "This is the very beginning of a text adventure game based on a custom entity component system. There isn't a whole lot here just yet. LOL!!!"));

            var streamId = Guid.NewGuid();
            var openFieldId = Guid.NewGuid();
            var largeRockId = Guid.NewGuid();

            RoomEntities = new List<TWEntity>()
            {
                new TWEntity(streamId, "Stream", new List<TWComponent>()
                {
                    new DisplayNameComponent("shallow stream display name", "Shallow Stream"),
                    new DescriptionComponent("shallow stream description", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep. There is quite a large rock to your east."),
                    new ExitComponent("shallow stream exit south", Direction.South, openFieldId),
                    new ExitComponent("shallow stream exit east", Direction.East, largeRockId)
                }),
                new TWEntity(openFieldId, "Open Field", new List<TWComponent>()
                {
                    new ItemComponent("leather coin purse item", new CoinPurse("leather coin purse", 32, 1)),
                    new ItemComponent("health potion item", new HealthPotion("health potion", 50, 10)),
                    new DisplayNameComponent("open field display name", "Open Field"),
                    new DescriptionComponent("open field description", "You are standing in an open field. All around you stands vibrant green grass. You can hear a running water to your north which you suspect is a small stream."),
                    new ExitComponent("open field exit", Direction.North, streamId)
                }),
                new TWEntity(largeRockId, "Large Rock", new List<TWComponent>() {
                    new DisplayNameComponent("large rock display name", "Large Rock"),
                    new DescriptionComponent("large rock description", "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings."),
                    new ExitComponent("large rock exit", Direction.West, streamId)
                })
            };

            PlayerEntity.AddComponent(new DescriptionComponent("player description", "You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!"));
            PlayerEntity.AddComponent(new InventoryComponent("player inventory"));
            PlayerEntity.AddComponent(new CurrencyComponent("player currency"));
            PlayerEntity.AddComponent(new IdComponent("player current room", openFieldId));
            PlayerEntity.AddComponent(new ShowDescriptionComponent("show current room description", RoomEntities.FirstOrDefault(x => x.Id == openFieldId)));
        }

        public void RunPreSystems()
        {
            MOTDSystem.Run(MOTDEntity, OutputEntity);
            RoomDescriptionSystem.Run(PlayerEntity, RoomEntities, OutputEntity);
        }

        public void RunCoreSystems()
        {
            CommandSystem.Run(CommandEntity, PlayerEntity, RoomEntities, PlayerEntity);
            RoomMovementSystem.Run(CommandEntity, PlayerEntity, RoomEntities, OutputEntity);
            RoomDescriptionSystem.Run(PlayerEntity, RoomEntities, OutputEntity);
            ItemsSystem.Run(PlayerEntity, RoomEntities, OutputEntity);
            UnknownCommandSystem.Run(CommandEntity, OutputEntity);
        }
    }
}
