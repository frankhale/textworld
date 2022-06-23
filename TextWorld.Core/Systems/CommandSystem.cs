using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class CommandSystem : TWSystem
    {
        private readonly Dictionary<string, Action<TWEntity, List<TWEntity>, CommandComponent, List<CommandComponent>, TWEntity>> CommandActions = new() {
            // FIXME: There is a lot of redundant string joining for command args going on. We need to 
            // do this once and reuse.
            { "quit", (playerEntity, roomEntities, commandComponent, processedComponents, outputEntity) => {                
                outputEntity.AddComponent(new QuitComponent("quit game"));
            } },
            { "look",  (playerEntity, roomEntities, commandComponent, processedComponents, outputEntity) => {
                if (commandComponent.Args.Length > 0 && commandComponent.Args[0] == "self")
                {                    
                    outputEntity.AddComponent(new ShowDescriptionComponent("show player description", playerEntity, DescriptionType.Room));
                }
                else
                {
                    var roomEntity = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);                    
                    outputEntity.AddComponent(new ShowDescriptionComponent("show room description", roomEntity!, DescriptionType.Room));

                    // Rooms having no exits is weird and shouldn't happen in a real game but in testing
                    // where certain parts of rooms are tested we ought to check here and not add extra
                    // components when they are not necessary.
                    var newRoomExits = roomEntity!.GetComponentsByType<ExitComponent>();
                    if(newRoomExits != null)
                    {
                        outputEntity.AddComponent(Helper.GetRoomExitInfoForRoom(playerEntity, roomEntities, roomEntity!));
                    }
                }
            } },
            { "show",  (playerEntity, roomEntities, commandComponent, processedComponents, outputEntity) => {                
                outputEntity.AddComponent(new ItemActionComponent("show an item action", string.Join(" ", commandComponent.Args), commandComponent, ItemActionType.Show, Helper.ShowItemAction));
            } },
            { "inspect",  (playerEntity, roomEntities, commandComponent, processedComponents, outputEntity) => {                
                outputEntity.AddComponent(new ItemActionComponent("show all items action", commandComponent, ItemActionType.ShowAll, Helper.ShowAllItemAction));
            } },
            { "take",  (playerEntity, roomEntities, commandComponent, processedComponents, outputEntity) => {                
                outputEntity.AddComponent(new ItemActionComponent("take item action", string.Join(" ", commandComponent.Args), commandComponent, ItemActionType.Take, Helper.TakeItemAction));
            } },
            { "take all",  (playerEntity, roomEntities, commandComponent, processedComponents, outputEntity) => {                
                outputEntity.AddComponent(new ItemActionComponent("take all items action", string.Join(" ", commandComponent.Args), commandComponent, ItemActionType.TakeAll, Helper.TakeAllItemsAction));
            } },
            { "drop",  (playerEntity, roomEntities, commandComponent, processedComponents, outputEntity) => {                
                outputEntity.AddComponent(new ItemActionComponent("drop items action", string.Join(" ", commandComponent.Args), commandComponent,  ItemActionType.Drop, Helper.DropItemAction));
            } },
            { "use",  (playerEntity, roomEntities, commandComponent, processedComponents, outputEntity) => {                
                outputEntity.AddComponent(new ItemActionComponent("use item action", string.Join(" ", commandComponent.Args), commandComponent, ItemActionType.Use, Helper.UseItemFromInventoryAction));
            } }
        };

        public override void Run(TWEntity commandEntity, TWEntity playerEntity, List<TWEntity> roomEntities, TWEntity outputEntity)
        {
            var processedComponents = new List<CommandComponent>();
            var commandComponent = commandEntity.GetComponentsByType<CommandComponent>().FirstOrDefault();

            if (commandComponent != null)
            {
                var commandPlusArgs = $"{commandComponent.Command} {string.Join(" ", commandComponent.Args)}".Trim();

                var foundAction = CommandActions.TryGetValue(commandPlusArgs, out Action<TWEntity, List<TWEntity>, CommandComponent, List<CommandComponent>, TWEntity>? action);

                if (!foundAction)
                {
                    foundAction = CommandActions.TryGetValue(commandComponent.Command!, out action);
                }
                
                if (foundAction)
                {
                    processedComponents.Add(commandComponent);
                    action?.Invoke(playerEntity, roomEntities, commandComponent, processedComponents, outputEntity);
                }
            }

            commandEntity.RemoveComponents(processedComponents);
        }
    }
}
