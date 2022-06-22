using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Systems
{
    public class ItemSystem : TWSystem
    {
        public override void Run(TWEntity playerEntity, List<TWEntity> itemEntities, List<TWEntity> roomEntities, TWEntity outputEntity)
        {
            var processedComponents = new List<TWComponent>();

            foreach (var component in playerEntity.GetComponentsByType<ItemActionComponent>())
            {
                processedComponents.Add(component);
                component.Action!(roomEntities, itemEntities, playerEntity, outputEntity, component);
            }

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
