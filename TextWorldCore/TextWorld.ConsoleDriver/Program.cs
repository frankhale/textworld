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
            var rock = new Entity("Room Entity");

            MOTDEntity.AddComponent(new DescriptionComponent("description", "Welcome to this fantastic not finished ECS based text adventure game..."));

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

            roomEntites.Add(openField);
            roomEntites.Add(stream);
            roomEntites.Add(rock);
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
            var directionCommandComponents = new List<CommandComponent>();                       

            foreach (CommandComponent commandComponent in commandEntity.Components.Where(x => x.GetType() == typeof(CommandComponent)))
            {
                if (commandComponent.Command == "north" ||
                   commandComponent.Command == "south" ||
                   commandComponent.Command == "east" ||
                   commandComponent.Command == "west")
                {
                    processedComponents.Add(commandComponent);
                    directionCommandComponents.Add(commandComponent);
                }
            }

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
                        var exitCommand = directionCommandComponents.FirstOrDefault(x => (exit as ExitComponent).Direction.ToString() == myTI.ToTitleCase(x.Command));

                        if (exitCommand != null)
                        {
                            directionCommandComponents.Remove(exitCommand);

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

            if (directionCommandComponents.Count() > 0)
            {
                Console.WriteLine($"I cannot go in that direction");
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

        private void TextInputSystem()
        {
            Console.Write("> ");
            var command = Console.ReadLine() ?? "";

            if (!string.IsNullOrEmpty(command))
            {
                commandEntity.AddComponent(new CommandComponent("command", command.ToLower()));
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

        private void UnknownCommandSystem()
        {
            var unknownCommandComponents = new List<UnknownCommandComponent>();

            foreach (CommandComponent commandComponent in commandEntity.Components.Where(x => x.GetType() == typeof(CommandComponent)))
            {
                unknownCommandComponents.Add(new UnknownCommandComponent("unknown command", commandComponent.Command));
            }

            commandEntity.Components.AddRange(unknownCommandComponents);

            foreach (UnknownCommandComponent commandComponent in commandEntity.Components.Where(x => x.GetType() == typeof(UnknownCommandComponent)))
            {
                Console.WriteLine($"I don't know how to do: {commandComponent.Command}");
            }

            commandEntity.Components.Clear();
        }

        public void Run()
        {
            MOTDSystem();

            while (running)
            {
                RoomDescriptionSystem();
                TextInputSystem();
                CommandSystem();
                RoomMovementSystem();
                UnknownCommandSystem();
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
