using System;
using System.Collections.Generic;
using System.Linq;
using TextWorld.Core;
using TextWorld.Core.Components;
using TextWorld.Core.Items;
using TextWorld.Core.Misc;
using TextWorld.Core.Systems;

namespace TextWorld.Game
{
    public class TextWorldGame
    {
        private bool running = true;

        // Entities
        private readonly Entity motdEntity = new Entity("MOTD Entity");
        private readonly Entity playerEntity = new Entity("Player Entity");
        private readonly Entity commandEntity = new Entity("Command Entity");
        private readonly Entity outputEntity = new Entity("Output Entity");
        private readonly List<Entity> roomEntities;
        // Systems
        private readonly MOTDSystem motdSystem = new MOTDSystem();
        private readonly ConsoleOutputSystem consoleOutputSystem = new ConsoleOutputSystem();
        private readonly ConsoleInputSystem consoleInputSystem = new ConsoleInputSystem();
        private readonly CommandSystem commandSystem = new CommandSystem();
        private readonly QuitSystem quitSystem = new QuitSystem();
        private readonly UnknownCommandSystem unknownCommandSystem = new UnknownCommandSystem();
        private readonly RoomDescriptionSystem roomDescriptionSystem = new RoomDescriptionSystem();
        private readonly RoomMovementSystem roomMovementSystem = new RoomMovementSystem();
        private readonly ItemSystem itemsSystem = new ItemSystem();

        public TextWorldGame()
        {
            motdEntity.AddComponent(new DescriptionComponent("description", "Welcome to this fantastic not finished ECS based text adventure game that doesn't do much but is attempting to work at some point, LOL!..."));

            var streamId = Guid.NewGuid();
            var openFieldId = Guid.NewGuid();
            var largeRockId = Guid.NewGuid();            

            roomEntities = new List<Entity>()
            {
                new Entity(streamId, "Stream", new List<Component>()
                {
                    new DisplayNameComponent("display name", "Shallow Stream"),
                    new DescriptionComponent("description", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep. There is quite a large rock to your east."),
                    new ExitComponent("exit", Direction.South, openFieldId),
                    new ExitComponent("exit", Direction.East, largeRockId)
                }),
                new Entity(openFieldId, "Open Field", new List<Component>()
                {
                    new ItemComponent("item", new CoinPurse("leather coin purse", 32)),
                    new DisplayNameComponent("display name", "Open Field"),
                    new DescriptionComponent("description", "You are standing in an open field. All around you stands vibrant green grass. You can hear a running water to your north which you suspect is a small stream."),
                    new ExitComponent("exit", Direction.North, streamId)
                }),
                new Entity(largeRockId, "Large Rock", new List<Component>() {
                    new DisplayNameComponent("display name", "Large Rock"),
                    new DescriptionComponent("description", "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings."),                    
                    new ExitComponent("exit", Direction.West, streamId)
                })
            };

            playerEntity.AddComponent(new DescriptionComponent("player description", "You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!"));
            playerEntity.AddComponent(new InventoryComponent("inventory"));
            playerEntity.AddComponent(new CurrencyComponent("currency"));
            playerEntity.AddComponent(new IdComponent("current room", openFieldId));
            playerEntity.AddComponent(new ShowDescriptionComponent("show current room description", roomEntities.FirstOrDefault(x => x.Id == openFieldId)));
        }

        public void Run()
        {
            motdSystem.Run(motdEntity, outputEntity);

            while (running)
            {
                roomDescriptionSystem.Run(playerEntity, roomEntities, outputEntity);
                consoleOutputSystem.Run(outputEntity);
                consoleInputSystem.Run(commandEntity);
                commandSystem.Run(commandEntity, playerEntity, roomEntities, playerEntity);
                roomMovementSystem.Run(commandEntity, playerEntity, roomEntities, outputEntity);
                itemsSystem.Run(playerEntity, roomEntities, outputEntity);
                unknownCommandSystem.Run(commandEntity, outputEntity);
                quitSystem.Run(playerEntity, () => running = false);
            }

            Console.WriteLine("Goodbye...");
        }
    }
}
