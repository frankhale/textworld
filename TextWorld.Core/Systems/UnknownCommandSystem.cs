using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class UnknownCommandSystem : TWSystem
    {
        public override void Run(TWEntity commandEntity, TWEntity outputEntity)
        {
            var unknownCommandComponents = new List<UnknownCommandComponent>();

            commandEntity.GetComponentsByType<CommandComponent>().ForEach(x =>
            {
                unknownCommandComponents.Add(new UnknownCommandComponent("unknown command", x.Command));
            });

            commandEntity.Components.Clear();

            if (unknownCommandComponents.Count > 0)
            {
                commandEntity.Components.AddRange(unknownCommandComponents);

                unknownCommandComponents.ForEach(x =>
                {
                    outputEntity.AddComponent(new OutputComponent("output for unknown command", $"I don't know how to do: {x.Command}", OutputType.Regular));
                });
            }
        }
    }
}
