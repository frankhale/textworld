using System.Collections.Generic;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    class CommandSystem : System
    {
        public override void Run(Entity input, Entity output)
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in input.GetComponentsByType<CommandComponent>())
            {
                if (commandComponent.Command == "quit")
                {
                    processedComponents.Add(commandComponent);
                    output.AddComponent(new QuitComponent("quit game"));
                }
                else if (commandComponent.Command == "look" || commandComponent.Command == "show")
                {
                    processedComponents.Add(commandComponent);
                    output.AddComponent(new ShowRoomDescriptionComponent());
                }
            }

            input.RemoveComponents(processedComponents);
        }
    }
}
