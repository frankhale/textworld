using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class CommandSystem : System
    {
        public override void Run(Entity commandEntity, Entity playerEntity, List<Entity> roomEntities, Entity outputEntity)
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity.GetComponentsByType<CommandComponent>())
            {
                var roomEntity = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);

                // TODO: Change this to use a switch expression

                if (roomEntity != null)
                {
                    switch (commandComponent.Command)
                    {
                        case "quit":
                            processedComponents.Add(commandComponent);
                            outputEntity.AddComponent(new QuitComponent("quit game"));
                            break;
                        case "look":
                        case "show":
                            if (commandComponent.Args.Length > 0 && commandComponent.Args[0] == "self")
                            {
                                processedComponents.Add(commandComponent);
                                outputEntity.AddComponent(new ShowDescriptionComponent("show player description", playerEntity));
                            }
                            else
                            {
                                processedComponents.Add(commandComponent);
                                outputEntity.AddComponent(new ShowDescriptionComponent("show room description", roomEntity));
                            }
                            break;
                        case "inspect":
                            processedComponents.Add(commandComponent);
                            outputEntity.AddComponent(new ItemActionComponent("show all items action", ItemAction.ShowAll));
                            break;
                        case "take":                            
                            processedComponents.Add(commandComponent);                            
                            outputEntity.AddComponent(new ItemActionComponent("take item action", string.Join(" ", commandComponent.Args), ItemAction.Take));
                            break;
                    }
                }
            }

            commandEntity.RemoveComponents(processedComponents);
        }
    }
}
