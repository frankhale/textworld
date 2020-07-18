using System.Collections.Generic;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    public class CommandSystem : System
    {
        public override void Run(Entity commandEntity, Entity outputEntity)
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity.GetComponentsByType<CommandComponent>())
            {
                switch(commandComponent.Command)
                {
                    case "quit":
                        processedComponents.Add(commandComponent);
                        outputEntity.AddComponent(new QuitComponent("quit game"));
                        break;
                    case "look":
                    case "show":
                        processedComponents.Add(commandComponent);
                        outputEntity.AddComponent(new ShowRoomDescriptionComponent());
                        break;                    
                }
            }

            commandEntity.RemoveComponents(processedComponents);
        }
    }
}
