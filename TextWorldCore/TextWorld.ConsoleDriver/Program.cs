using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.Misc;

namespace TextWorld.ConsoleDriver
{
    public class TextWorld
    {
        private bool running = true;
        private readonly Entity MOTDEntity = new Entity("MOTD Entity");
        private readonly Entity playerEntity = new Entity("Player Entity");
        private readonly Entity commandEntity = new Entity("Command Entity");
        private readonly List<Entity> roomEntites = new List<Entity>();

        public TextWorld()
        {
            var stream = new Entity("Room Entity");
            var openField = new Entity("Room Entity");

            MOTDEntity.AddComponent(new DescriptionComponent("description", "Welcome to this fantastic not finished ECS based text adventure game..."));

            playerEntity.AddComponent(new IdComponent("current room", openField.Id));
            playerEntity.AddComponent(new RoomChangedComponent());

            stream.AddComponent(new DisplayNameComponent("display name", "Shallow Stream"));
            stream.AddComponent(new DescriptionComponent("description", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep."));
            stream.AddComponent(new ExitComponent("exit", Direction.South, openField.Id));

            openField.AddComponent(new DisplayNameComponent("display name", "Open Field"));
            openField.AddComponent(new DescriptionComponent("description", "You are standing in an open field. All around you stands vibrant green grass. You can hear a running water to your north which you suspect is a small stream."));
            openField.AddComponent(new ExitComponent("exit", Direction.North, stream.Id));

            roomEntites.Add(openField);
            roomEntites.Add(stream);
        }

        private void Quit()
        {
            Console.WriteLine("Goodbye...");
            running = false;
        }

        private void CommandSystem()
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity.Components.Where(x => x.GetType() == typeof(CommandComponent)))
            {
                CommandComponent c = commandComponent as CommandComponent;

                if (c.Command == "quit")
                {
                    processedComponents.Add(c);
                    Quit();
                }
                else if (c.Command == "look" || c.Command == "show")
                {
                    processedComponents.Add(c);
                    playerEntity.AddComponent(new ShowRoomDescriptionComponent());
                }
            }

            foreach (var commandComponent in processedComponents)
            {
                commandEntity.RemoveComponent(commandComponent);
            }
        }

        private void RoomMovementSystem()
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity.Components.Where(x => x.GetType() == typeof(CommandComponent)))
            {
                CommandComponent c = commandComponent as CommandComponent;

                CommandComponent movementCommand = null;

                if (c.Command == "north" ||
                   c.Command == "south" ||
                   c.Command == "east" ||
                   c.Command == "west")
                {
                    movementCommand = c;
                }

                if (movementCommand?.Command != null)
                {
                    processedComponents.Add(c);

                    // get the component called "current room" on the player entity
                    var currentRoomComponent = playerEntity.Components.FirstOrDefault(x => x.Name == "current room") as IdComponent;

                    if (currentRoomComponent != null)
                    {
                        // find the room entity with that Id
                        var currentRoomEntity = roomEntites.FirstOrDefault(x => x.Id == currentRoomComponent.Id);

                        if (currentRoomEntity != null)
                        {
                            // get the exit components and compare the movement command with the exits for the room
                            var currentRoomExits = currentRoomEntity.Components.Where(x => x.Name == "exit");

                            TextInfo myTI = new CultureInfo("en-US", false).TextInfo;

                            foreach (var exit in currentRoomExits)
                            {

                                if ((exit as ExitComponent).Direction.ToString() == myTI.ToTitleCase(movementCommand.Command))
                                {
                                    // get new room entity based on exit component room id
                                    var newRoomEntity = roomEntites.FirstOrDefault(x => x.Id == (exit as ExitComponent).RoomId);

                                    if (newRoomEntity != null)
                                    {
                                        // if we find a match set the players current room component to a new Id
                                        currentRoomComponent.SetId(newRoomEntity.Id);

                                        // Add a room changed component to the player entity
                                        playerEntity.AddComponent(new RoomChangedComponent());
                                    }
                                }
                            }
                        }
                    }
                }
            }

            foreach (var commandComponent in processedComponents)
            {
                commandEntity.RemoveComponent(commandComponent);
            }
        }

        private void RoomDescriptionSystem()
        {
            var processedComponents = new List<Component>();

            foreach (var component in playerEntity.Components
                .Where(x => x.GetType() == typeof(RoomChangedComponent) ||
                            x.GetType() == typeof(ShowRoomDescriptionComponent)))
            {
                processedComponents.Add(component);

                var descriptionComponent = GetPlayersCurrentRoomDescriptionComponent();

                if (descriptionComponent != null)
                {
                    Console.WriteLine(descriptionComponent.Description);
                }
            }

            foreach (var component in processedComponents)
            {
                playerEntity.RemoveComponent(component);
            }
        }

        private void MOTDSystem()
        {
            var motdDescriptionComponent = (DescriptionComponent)MOTDEntity.Components.FirstOrDefault(x => x.Name == "description");

            if (motdDescriptionComponent != null)
            {
                Console.WriteLine(motdDescriptionComponent.Description);
                Console.WriteLine();
                Console.WriteLine();
            }
        }

        private DescriptionComponent GetPlayersCurrentRoomDescriptionComponent()
        {
            if (playerEntity.Components.FirstOrDefault(x => x.Name == "current room") is IdComponent currentRoomComponent)
            {
                // find the room entity with that Id
                var currentRoomEntity = roomEntites.FirstOrDefault(x => x.Id == currentRoomComponent.Id);

                if (currentRoomEntity != null)
                {
                    // get description component
                    if (currentRoomEntity.Components.FirstOrDefault(x => x.Name == "description") is DescriptionComponent description)
                    {
                        return description;
                    }
                }
            }

            return null;
        }

        public void Run()
        {
            MOTDSystem();
            RoomDescriptionSystem();

            while (running)
            {
                Console.Write("> ");
                var command = Console.ReadLine() ?? "";

                if (!string.IsNullOrEmpty(command))
                {
                    commandEntity.AddComponent(new CommandComponent("command", command.ToLower()));
                }

                CommandSystem();
                RoomMovementSystem();
                RoomDescriptionSystem();
            }
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            var tw = new TextWorld();
            tw.Run();
        }
    }
}
