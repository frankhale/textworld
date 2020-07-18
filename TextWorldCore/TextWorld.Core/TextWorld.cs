using System;
using System.Collections.Generic;
using TextWorld.Core.Components;
using TextWorld.Core.Misc;
using TextWorld.Core.Systems;

namespace TextWorld.Core
{
    public class TextWorldGame
    {
        private bool running = true;
        private readonly Entity motdEntity = new Entity("MOTD Entity");
        private readonly Entity playerEntity = new Entity("Player Entity");
        private readonly Entity commandEntity = new Entity("Command Entity");
        private readonly Entity outputEntity = new Entity("Output Entity");
        private readonly List<Entity> roomEntities = new List<Entity>();

        private readonly MOTDSystem motdSystem = new MOTDSystem();
        private readonly ConsoleOutputSystem consoleOutputSystem = new ConsoleOutputSystem();
        private readonly ConsoleInputSystem consoleInputSystem = new ConsoleInputSystem();
        private readonly CommandSystem commandSystem = new CommandSystem();
        private readonly QuitSystem quitSystem = new QuitSystem();
        private readonly UnknownCommandSystem unknownCommandSystem = new UnknownCommandSystem();
        private readonly RoomDescriptionSystem roomDescriptionSystem = new RoomDescriptionSystem();
        private readonly RoomMovementSystem roomMovementSystem = new RoomMovementSystem();

        public TextWorldGame()
        {
            var stream = new Entity("Room Entity");
            var openField = new Entity("Room Entity");
            var rock = new Entity("Room Entity");

            motdEntity.AddComponent(new DescriptionComponent("description", "Welcome to this fantastic not finished ECS based text adventure game that doesn't do much but is attempting to work at some point, LOL!..."));

            playerEntity.AddComponent(new IdComponent("current room", openField.Id));
            playerEntity.AddComponent(new ShowRoomDescriptionComponent());

            stream.AddComponent(new DisplayNameComponent("display name", "Shallow Stream"));
            stream.AddComponent(new DescriptionComponent("description", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep. There is quite a large rock to your east."));
            stream.AddComponent(new ExitComponent("exit", Direction.South, openField.Id));
            stream.AddComponent(new ExitComponent("exit", Direction.East, rock.Id));

            openField.AddComponent(new DisplayNameComponent("display name", "Open Field"));
            openField.AddComponent(new DescriptionComponent("description", "You are standing in an open field. All around you stands vibrant green grass. You can hear a running water to your north which you suspect is a small stream."));
            openField.AddComponent(new ExitComponent("exit", Direction.North, stream.Id));

            rock.AddComponent(new DisplayNameComponent("display name", "Large Rock"));
            rock.AddComponent(new DescriptionComponent("description", "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings."));
            rock.AddComponent(new ExitComponent("exit", Direction.West, stream.Id));

            roomEntities.Add(openField);
            roomEntities.Add(stream);
            roomEntities.Add(rock);
        }

        public void Run()
        {            
            motdSystem.Run(motdEntity, outputEntity);

            while (running)
            {                
                roomDescriptionSystem.Run(playerEntity, roomEntities, outputEntity);
                consoleOutputSystem.Run(outputEntity);
                consoleInputSystem.Run(commandEntity);
                commandSystem.Run(commandEntity, playerEntity);
                quitSystem.Run(playerEntity, () =>
                {
                    Console.WriteLine("Goodbye...");
                    running = false;
                });                
                roomMovementSystem.Run(commandEntity, playerEntity, roomEntities, outputEntity);
                unknownCommandSystem.Run(commandEntity, outputEntity);
            }
        }
    }
}
