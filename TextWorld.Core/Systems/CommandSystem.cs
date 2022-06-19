using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class CommandSystem : TWSystem
    {
        public override void Run(TWEntity commandEntity, TWEntity playerEntity, List<TWEntity> roomEntities, TWEntity outputEntity)
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity.GetComponentsByType<CommandComponent>())
            {
                var roomEntity = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);

                if (roomEntity != null)
                {
                    switch (commandComponent.Command)
                    {
                        case "quit":
                            processedComponents.Add(commandComponent);
                            outputEntity.AddComponent(new QuitComponent("quit game"));
                            break;
                        case "look":
                            if (commandComponent.Args.Length > 0 && commandComponent.Args[0] == "self")
                            {
                                processedComponents.Add(commandComponent);
                                outputEntity.AddComponent(new ShowDescriptionComponent("show player description", playerEntity, DescriptionType.Room));
                            }
                            else
                            {
                                processedComponents.Add(commandComponent);
                                outputEntity.AddComponent(new ShowDescriptionComponent("show room description", roomEntity, DescriptionType.Room));
                                outputEntity.AddComponent(Helper.GetRoomExitInfoForRoom(playerEntity, roomEntities, roomEntity));
                            }
                            break;
                        case "show":
                            processedComponents.Add(commandComponent);
                            outputEntity.AddComponent(new ItemActionComponent("show an item action", string.Join(" ", commandComponent.Args), ItemActionType.Show, Helper.ShowItemAction));
                            break;
                        case "inspect":
                            processedComponents.Add(commandComponent);
                            outputEntity.AddComponent(new ItemActionComponent("show all items action", ItemActionType.ShowAll, Helper.ShowAllItemAction));
                            break;
                        case "take":
                            processedComponents.Add(commandComponent);
                            outputEntity.AddComponent(new ItemActionComponent("take item action", string.Join(" ", commandComponent.Args), ItemActionType.Take, Helper.TakeItemAction));
                            break;
                    }
                }
            }

            commandEntity.RemoveComponents(processedComponents);
        }
    }
}
