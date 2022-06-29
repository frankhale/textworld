using System.Globalization;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class RoomMovementSystem : TWSystem
    {
        public override void Run(TWEntityCollection gameEntities)
        {
            var playerEntity = gameEntities.GetEntityByName("players", "player");
            var outputEntity = gameEntities.GetEntityByName("misc", "output");
            var commandEntity = gameEntities.GetEntityByName("misc", "command");
            var roomEntities = gameEntities.GetEntitiesByName("rooms");

            TextInfo myTI = new CultureInfo("en-US", false).TextInfo;
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity!.GetComponentsByType<CommandComponent>())
            {
                var commandAsTitleCase = myTI.ToTitleCase(commandComponent.Command!);

                if (Enum.TryParse<Direction>(commandAsTitleCase, out Direction direction))
                {
                    processedComponents.Add(commandComponent);

                    var currentRoomComponent = playerEntity!.GetComponentByName<IdComponent>("player current room");
                    var currentRoomEntity = roomEntities!.FirstOrDefault(x => x.Id == currentRoomComponent!.Id);
                    var currentRoomExits = currentRoomEntity!.GetComponentsByType<ExitComponent>();
                    var exit = currentRoomExits.FirstOrDefault(x => x.Direction.ToString() == commandAsTitleCase);

                    if (exit != null)
                    {
                        var newRoomEntity = roomEntities!.FirstOrDefault(x => x.Id == exit.RoomId);

                        if (newRoomEntity != null)
                        {
                            currentRoomComponent!.Id = newRoomEntity.Id;

                            playerEntity.AddComponent(new ShowDescriptionComponent("player new room", newRoomEntity, DescriptionType.Room));
                            playerEntity.AddComponent(Helper.GetRoomExitInfoForRoom(playerEntity, roomEntities!, newRoomEntity));
                        }
                    }
                    else
                    {
                        outputEntity!.AddComponent(new OutputComponent("output for inaccessible direction", "I cannot go in that direction", OutputType.Regular));
                    }

                    commandEntity.RemoveComponents(processedComponents);
                }
            }
        }
    }
}
