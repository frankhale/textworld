using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Systems
{
    public class RoomDescriptionSystem : ECS.System
    {
        public override void Run(Entity playerEntity, List<Entity> roomEntities, Entity outputEntity)
        {
            var processedComponents = new List<Component>();

            foreach (var component in playerEntity.Components
                .Where(x => x.GetType() == typeof(ShowDescriptionComponent)))
            {
                processedComponents.Add(component);

                var entity = (component as ShowDescriptionComponent).Entity;

                if (entity != null)
                {
                    var descriptionComponent = entity.GetComponentByType<DescriptionComponent>();

                    if (descriptionComponent != null)
                    {
                        outputEntity.AddComponent(new OutputComponent("room output for description", descriptionComponent.Description));
                    }
                }
            }

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
