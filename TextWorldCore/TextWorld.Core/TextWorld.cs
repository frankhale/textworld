using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection.Metadata;
using TextWorld.Core.Components;
using TextWorld.Core.Misc;

// NOTE: We are not really there yet. This is an experiment in learning and the code is pretty bad in places.
// The entities are kind of hard to work with, components probably don't need names (only types). There is a 
// lot of collection iteration going on. There is still much to be learned here by playing with this concept.
//
// The current game loop doesn't have any other concept other than getting input from STDIN and sending output
// to STDOUT. That's not good as I'd rather have this take in strings and output strings so that I can use it
// in a server based app which can have a web frontend.
//
// Systems should return a string instead of calling Console.WriteLine directly

namespace TextWorld.Core
{
    public class TextWorldGame
    {
        private bool running = true;
        private readonly Entity motdEntity = new Entity("MOTD Entity");
        private readonly Entity playerEntity = new Entity("Player Entity");
        private readonly Entity commandEntity = new Entity("Command Entity");
        private readonly Entity outputEntity = new Entity("Output Entity");
        private readonly List<Entity> roomEntites = new List<Entity>();

        public TextWorldGame()
        {
            var stream = new Entity("Room Entity");
            var openField = new Entity("Room Entity");
            var rock = new Entity("Room Entity");

            motdEntity.AddComponent(new DescriptionComponent("description", "Welcome to this fantastic not finished ECS based text adventure game..."));

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

        private DescriptionComponent GetPlayersCurrentRoomDescriptionComponent(Entity playerEntity)
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

        private void Quit()
        {
            Console.WriteLine("Goodbye...");
            running = false;
        }

        private void CommandSystem(Entity commandEntity, Entity playerEntity)
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

        private void RoomMovementSystem(Entity commandEntity, Entity outputEntity)
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
            var currentRoomComponent = (IdComponent)playerEntity.Components.FirstOrDefault(x => x.Name == "current room");

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
            
            foreach (var commandComponent in processedComponents)
            {
                commandEntity.RemoveComponent(commandComponent);
            }

            if (directionCommandComponents.Count() > 0)
            {
                outputEntity.AddComponent(new OutputComponent("output", $"I cannot go in that direction"));
            }
        }

        private void RoomDescriptionSystem(Entity playerEntity, Entity outputEntity)
        {            
            var processedComponents = new List<Component>();

            foreach (var component in playerEntity.Components
                .Where(x => x.GetType() == typeof(RoomChangedComponent) ||
                            x.GetType() == typeof(ShowRoomDescriptionComponent)))
            {
                processedComponents.Add(component);                
            }

            if(processedComponents.Count() > 0)
            {
                var descriptionComponent = GetPlayersCurrentRoomDescriptionComponent(playerEntity);

                if (descriptionComponent != null)
                {
                    outputEntity.AddComponent(new OutputComponent("output", descriptionComponent.Description));
                }
            }

            foreach (var component in processedComponents)
            {
                playerEntity.RemoveComponent(component);
            }
        }

        private void MOTDSystem(Entity motdEntity, Entity outputEntity)
        {
            var motdDescriptionComponent = (DescriptionComponent)motdEntity.Components.FirstOrDefault(x => x.Name == "description");

            if (motdDescriptionComponent != null)
            {
                outputEntity.AddComponent(new OutputComponent("output", motdDescriptionComponent.Description));
            }
        }

        private void UnknownCommandSystem(Entity commandEntity, Entity outputEntity)
        {
            var unknownCommandComponents = new List<UnknownCommandComponent>();

            foreach (CommandComponent commandComponent in commandEntity.Components.Where(x => x.GetType() == typeof(CommandComponent)))
            {
                unknownCommandComponents.Add(new UnknownCommandComponent("unknown command", commandComponent.Command));
            }

            commandEntity.Components.AddRange(unknownCommandComponents);

            var unknownCommandComponentsCount = commandEntity.Components.Where(x => x.GetType() == typeof(UnknownCommandComponent)).Count();

            commandEntity.Components.Clear();

            if (unknownCommandComponentsCount > 0)
            {
                outputEntity.AddComponent(new OutputComponent("output", "I don't know how to do that."));
            }
        }

        private void TextInputSystem(Entity commandEntity)
        {
            Console.Write("> ");
            var command = Console.ReadLine() ?? "";

            if (!string.IsNullOrEmpty(command))
            {
                commandEntity.AddComponent(new CommandComponent("command", command.ToLower()));
            }
        }

        private void TextOuputSystem(Entity outputEntity)
        {
            foreach (OutputComponent outputComponent in outputEntity.Components.Where(x => x.GetType() == typeof(OutputComponent)))
            {
                Console.WriteLine(outputComponent.Value);
            }

            outputEntity.Components.Clear();
        }

        public void Run()
        {
            MOTDSystem(motdEntity, outputEntity);

            while (running)
            {
                RoomDescriptionSystem(playerEntity, outputEntity);
                TextOuputSystem(outputEntity);                                
                TextInputSystem(commandEntity);
                CommandSystem(commandEntity, playerEntity);
                RoomMovementSystem(commandEntity, outputEntity);
                UnknownCommandSystem(commandEntity, outputEntity);                
            }
        }
    }
}
