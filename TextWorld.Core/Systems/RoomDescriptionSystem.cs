using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class RoomDescriptionSystem : TWSystem
    {
        public override void Run(TWEntity playerEntity, List<TWEntity> roomEntities, TWEntity outputEntity)
        {
            var processedComponents = new List<TWComponent>();

            foreach (var component in playerEntity.Components
                .Where(x => x.GetType() == typeof(ShowDescriptionComponent)))
            {
                processedComponents.Add(component);

                var entity = (component as ShowDescriptionComponent)?.Entity;

                if (entity != null)
                {
                    var descriptionComponent = entity.GetComponentByType<DescriptionComponent>();

                    if (descriptionComponent != null)
                    {
                        outputEntity.AddComponent(new OutputComponent("description output", descriptionComponent.Description, OutputType.Regular));
                    }
                }
            }

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
