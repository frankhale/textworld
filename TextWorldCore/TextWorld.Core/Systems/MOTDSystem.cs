using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Systems
{
    public class MOTDSystem : ECS.System
    {
        public override void Run(Entity motdEntity, Entity outputEntity)
        {
            var motdDescriptionComponent = motdEntity.GetComponentByType<DescriptionComponent>();

            if (motdDescriptionComponent != null)
            {
                outputEntity.AddComponent(new OutputComponent("motd output for description", motdDescriptionComponent.Description));
            }
        }
    }
}
