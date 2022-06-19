using System.Globalization;
using System.Xml.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
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
                            playerEntity.AddComponent(Helper.GetRoomExitInfoForRoom(playerEntity, roomEntities, newRoomEntity));

                            //var newRoomExits = newRoomEntity.GetComponentsByType<ExitComponent>();
                            //var exitDictionary = newRoomExits.ToDictionary(x => x.RoomId);
                            //var exitRooms = roomEntities.Where(x => exitDictionary.TryGetValue(x.Id, out var e) /*&& x.Id != currentRoomEntity.Id*/).ToList();
                            //var exitInfo = exitRooms.Select(x => $"{exitDictionary[x.Id].Direction} -> {x.Name}".ToString()).ToList();
                            //playerEntity.AddComponent(new ShowDescriptionComponent(string.Join(", ", exitInfo), exitRooms, DescriptionType.Exit));
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
