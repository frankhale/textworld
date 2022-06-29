using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class MOTDSystem : TWSystem
    {
        public override void Run(TWEntityCollection entityCollection)
        {
            var motdEntity = entityCollection.GetEntityByName("misc", "motd");
            var outputEntity = entityCollection.GetEntityByName("misc", "output");

            var motdDescriptionComponent = motdEntity!.GetComponentByType<DescriptionComponent>();

            if (motdDescriptionComponent != null)
            {
                outputEntity!.AddComponent(new OutputComponent("motd output for description", motdDescriptionComponent.Description, OutputType.MessageOfTheDay));
            }
        }
    }
}
