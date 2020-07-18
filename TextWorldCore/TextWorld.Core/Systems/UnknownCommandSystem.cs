using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    class UnknownCommandSystem : System
    {
        public override void Run(Entity input, Entity output)
        {
            var unknownCommandComponents = new List<UnknownCommandComponent>();

            foreach (CommandComponent commandComponent in input.GetComponentsByType<CommandComponent>())
            {
                unknownCommandComponents.Add(new UnknownCommandComponent("unknown command", commandComponent.Command));
            }

            input.Components.AddRange(unknownCommandComponents);

            var unknownCommandComponentsCount = input.GetComponentsByType<UnknownCommandComponent>().Count();

            input.Components.Clear();

            if (unknownCommandComponentsCount > 0)
            {
                output.AddComponent(new OutputComponent("output", "I don't know how to do that."));
            }
        }
    }
}
