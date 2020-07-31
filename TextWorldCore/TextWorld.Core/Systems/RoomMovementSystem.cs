using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class RoomMovementSystem : ECS.TWSystem
    {
        public override void Run(TWEntity commandEntity, TWEntity playerEntity, List<TWEntity> roomEntities, TWEntity outputEntity)
        {
            var processedComponents = new List<CommandComponent>();
            var directionCommandComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity.GetComponentsByType<CommandComponent>())
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

            var currentRoomComponent = playerEntity.GetComponentByName<IdComponent>("player current room");

            if (currentRoomComponent != null)
            {
                var currentRoomEntity = roomEntities.FirstOrDefault(x => x.Id == currentRoomComponent.Id);

                if (currentRoomEntity != null)
                {
                    var currentRoomExits = currentRoomEntity.GetComponentsByType<ExitComponent>();

                    TextInfo myTI = new CultureInfo("en-US", false).TextInfo;

                    foreach (var exit in currentRoomExits)
                    {
                        var exitCommand = directionCommandComponents.FirstOrDefault(x => (exit as ExitComponent).Direction.ToString() == myTI.ToTitleCase(x.Command));

                        if (exitCommand != null)
                        {
                            directionCommandComponents.Remove(exitCommand);

                            // get new room entity based on exit component room id
                            var newRoomEntity = roomEntities.FirstOrDefault(x => x.Id == (exit as ExitComponent).RoomId);

                            if (newRoomEntity != null)
                            {
                                // if we find a match set the players current room component to a new Id
                                currentRoomComponent.SetId(newRoomEntity.Id);

                                // Add a room changed component to the player entity
                                playerEntity.AddComponent(new ShowDescriptionComponent("player new room", newRoomEntity));
                            }
                        }
                    }
                }
            }

            commandEntity.RemoveComponents(processedComponents);

            if (directionCommandComponents.Count() > 0)
            {
                outputEntity.AddComponent(new OutputComponent("output for inaccessible direction", $"I cannot go in that direction", OutputType.Regular));
            }
        }
    }
}
