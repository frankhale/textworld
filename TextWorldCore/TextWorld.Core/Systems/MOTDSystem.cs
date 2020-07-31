using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class MOTDSystem : ECS.TWSystem
    {
        public override void Run(TWEntity motdEntity, TWEntity outputEntity)
        {
            var motdDescriptionComponent = motdEntity.GetComponentByType<DescriptionComponent>();

            if (motdDescriptionComponent != null)
            {
                outputEntity.AddComponent(new OutputComponent("motd output for description", motdDescriptionComponent.Description, OutputType.MessageOfTheDay));
            }
        }
    }
}
