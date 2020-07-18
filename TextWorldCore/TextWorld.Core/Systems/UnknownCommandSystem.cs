using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    public class UnknownCommandSystem : System
    {
        public override void Run(Entity commandEntity, Entity outputEntity)
        {
            var unknownCommandComponents = new List<UnknownCommandComponent>();

            foreach (CommandComponent commandComponent in commandEntity.GetComponentsByType<CommandComponent>())
            {
                unknownCommandComponents.Add(new UnknownCommandComponent("unknown command", commandComponent.Command));
            }

            commandEntity.Components.AddRange(unknownCommandComponents);

            var unknownCommandComponentsCount = commandEntity.GetComponentsByType<UnknownCommandComponent>().Count();

            commandEntity.Components.Clear();

            if (unknownCommandComponentsCount > 0)
            {
                outputEntity.AddComponent(new OutputComponent("output", "I don't know how to do that."));
            }
        }
    }
}
