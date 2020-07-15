using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace TextWorldCore
{
    public enum Direction
    {
        North,
        South,
        East,
        West
    }

    public abstract class Component
    {
        public string Name { get; private set; }

        protected Component(string name)
        {
            Name = name;
        }
    }

    public class CommandComponent : Component
    {
        public string Command { get; private set; }

        public CommandComponent(string name, string command) : base(name)
        {
            Command = command;
        }
    }

    public class DescriptionComponent : Component
    {
        public string Description { get; private set; }

        public DescriptionComponent(string name, string description) : base(name)
        {
            Description = description;
        }
    }

    public class DisplayNameComponent : Component
    {
        public string DisplayName { get; private set; }

        public DisplayNameComponent(string name, string displayName) : base(name)
        {
            DisplayName = displayName;
        }
    }

    public class IdComponent : Component
    {
        public Guid Id { get; private set; }

        public IdComponent(string name, Guid id) : base(name)
        {
            Id = id;
        }

        public void SetId(Guid id)
        {
            Id = id;
        }
    }

    public class RoomChangedComponent : Component
    {
        public RoomChangedComponent(string name = "room changed") : base(name) { }
    }

    public class ExitComponent : Component
    {
        public Direction Direction { get; private set; }
        public Guid RoomId { get; private set; }

        public ExitComponent(string name, Direction direction, Guid roomId) : base(name)
        {
            Direction = direction;
            RoomId = roomId;
        }
    }

    public class Entity
    {
        public Guid Id { get; } = Guid.NewGuid();
        public string Name { get; private set; }
        public List<Component> Components { get; private set; } = new List<Component>();

        public Entity(string name)
        {
            Name = name;
        }

        public void AddComponent<T>(T component) where T : Component
        {
            Components.Add(component);
        }

        public void RemoveComponent<T>(T component) where T : Component
        {
            Components.Remove(component);
        }
    }

    public class TextWorld
    {
        private bool running = true;
        private readonly Entity coreCommandEntity = new Entity("Command Entity");
        private readonly List<Entity> roomEntites = new List<Entity>();
        private readonly Entity playerEntity = new Entity("Player Entity");

        public TextWorld()
        {
            var stream = new Entity("Room Entity");
            var openField = new Entity("Room Entity");

            playerEntity.AddComponent(new IdComponent("current room", openField.Id));

            stream.AddComponent(new DisplayNameComponent("display name", "Shallow Stream"));
            stream.AddComponent(new DescriptionComponent("description", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep."));
            stream.AddComponent(new ExitComponent("exit", Direction.South, openField.Id));

            openField.AddComponent(new DisplayNameComponent("display name", "Open Field"));
            openField.AddComponent(new DescriptionComponent("description", "You are standing in an open field. All around you stands vibrant green grass. You can hear a running water to your north which you suspect is a small stream."));
            openField.AddComponent(new ExitComponent("exit", Direction.North, stream.Id));

            roomEntites.Add(openField);
            roomEntites.Add(stream);
        }

        private void CommandSystem()
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in coreCommandEntity.Components.Where(x => x.GetType() == typeof(CommandComponent)))
            {
                CommandComponent c = commandComponent as CommandComponent;

                if (c.Command == "quit")
                {
                    processedComponents.Add(c);
                    Console.WriteLine("Goodbye...");
                    running = false;
                }
            }

            foreach (var commandComponent in processedComponents)
            {
                coreCommandEntity.RemoveComponent(commandComponent);
            }
        }

        private void RoomMovementSystem()
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in coreCommandEntity.Components.Where(x => x.GetType() == typeof(CommandComponent)))
            {
                CommandComponent c = commandComponent as CommandComponent;

                var movementCommand = c.Command switch
                {
                    "north" or "south" or "east" or "west" => c,
                    _ => null
                };

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

                                if((exit as ExitComponent).Direction.ToString() == myTI.ToTitleCase(movementCommand.Command))
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
                coreCommandEntity.RemoveComponent(commandComponent);
            }
        }

        private void RoomChangedSystem() 
        {
            var processedComponents = new List<RoomChangedComponent>();

            foreach (var roomChangedComponent in playerEntity.Components.Where(x => x.GetType() == typeof(RoomChangedComponent)))
            {
                RoomChangedComponent c = roomChangedComponent as RoomChangedComponent;
                processedComponents.Add(c);

                var descriptionComponent = GetPlayersCurrentRoomDescriptionComponent();

                if(descriptionComponent != null)
                {
                    Console.WriteLine(descriptionComponent.Description);
                }
            }

            foreach (var component in processedComponents)
            {
                playerEntity.RemoveComponent(component);
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
            Console.WriteLine("Welcome to Text World!");
            Console.WriteLine();

            while (running)
            {
                Console.Write("> ");
                var command = Console.ReadLine() ?? "";

                if (!string.IsNullOrEmpty(command))
                {
                    coreCommandEntity.AddComponent(new CommandComponent("command", command.ToLower()));
                }

                CommandSystem();
                RoomMovementSystem();
                RoomChangedSystem();
            }
        }
    }

    static class Program
    {
        static void Main()
        {
            var tw = new TextWorld();
            tw.Run();
        }
    }
}
