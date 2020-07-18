using System.Collections.Generic;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    class CommandSystem : System
    {
        public override void Run(Entity commandEntity, Entity outputEntity)
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity.GetComponentsByType<CommandComponent>())
            {
                if (commandComponent.Command == "quit")
                {
                    processedComponents.Add(commandComponent);
                    outputEntity.AddComponent(new QuitComponent("quit game"));
                }
                else if (commandComponent.Command == "look" || commandComponent.Command == "show")
                {
                    processedComponents.Add(commandComponent);
                    outputEntity.AddComponent(new ShowRoomDescriptionComponent());
                }
            }

            commandEntity.RemoveComponents(processedComponents);
        }
    }
}
