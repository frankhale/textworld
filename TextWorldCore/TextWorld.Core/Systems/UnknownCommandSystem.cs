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

            commandEntity.GetComponentsByType<CommandComponent>().ForEach(x =>
            {
                unknownCommandComponents.Add(new UnknownCommandComponent("unknown command", x.Command));
            });

            commandEntity.Components.Clear();

            if (unknownCommandComponents.Count() > 0)
            {
                commandEntity.Components.AddRange(unknownCommandComponents);

                unknownCommandComponents.ForEach(x =>
                {
                    outputEntity.AddComponent(new OutputComponent("output", $"I don't know how to do: {x.Command}"));
                });
            }
        }
    }
}
