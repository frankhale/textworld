using System.Globalization;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    // TODO: We don't want to explicitly put exit locations in the description of a room. 
    // We can use the exit components to describe the exits and leave the description for 
    // a detailed description of the room.

    public class RoomMovementSystem : TWSystem
    {
        public override void Run(TWEntity commandEntity, TWEntity playerEntity, List<TWEntity> roomEntities, TWEntity outputEntity)
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity.GetComponentsByType<CommandComponent>())
            {
                if (commandComponent.Command == "north" ||
                   commandComponent.Command == "south" ||
                   commandComponent.Command == "east" ||
                   commandComponent.Command == "west")
                {
                    processedComponents.Add(commandComponent);

                    var currentRoomComponent = playerEntity.GetComponentByName<IdComponent>("player current room");
                    var currentRoomEntity = roomEntities.FirstOrDefault(x => x.Id == currentRoomComponent!.Id);
                    var currentRoomExits = currentRoomEntity!.GetComponentsByType<ExitComponent>();

                    TextInfo myTI = new CultureInfo("en-US", false).TextInfo;

                    var exit = currentRoomExits.FirstOrDefault(x => x.Direction.ToString() == myTI.ToTitleCase(commandComponent.Command));
                    
                    if (exit != null)
                    {
                        var newRoomEntity = roomEntities.FirstOrDefault(x => x.Id == exit.RoomId);

                        if (newRoomEntity != null)
                        {
                            currentRoomComponent!.SetId(newRoomEntity.Id);
                            playerEntity.AddComponent(new ShowDescriptionComponent("player new room", newRoomEntity, DescriptionType.Room));                            
                        }
                    }
                    else
                    {
                        outputEntity.AddComponent(new OutputComponent("output for inaccessible direction", "I cannot go in that direction", OutputType.Regular));
                    }


                    commandEntity.RemoveComponents(processedComponents);
                }
            }
        }
    }
}
