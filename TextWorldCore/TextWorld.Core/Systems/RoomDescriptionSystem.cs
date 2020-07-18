using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    public class RoomDescriptionSystem : System
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
                    var descriptionComponent = entity.GetFirstComponentByType<DescriptionComponent>();

                    if (descriptionComponent != null)
                    {
                        outputEntity.AddComponent(new OutputComponent("output", descriptionComponent.Description));
                    }
                }
            }

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
