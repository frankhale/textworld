using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Systems
{
    public class ItemSystem : TWSystem
    {
        public override void Run(TWEntityCollection gameEntities)
        {            
            var playerEntity = gameEntities.GetEntityByName("players", "player");            
            var outputEntity = gameEntities.GetEntityByName("misc", "output");
            var roomEntities = gameEntities.GetEntitiesByName("rooms");
            var itemEntities = gameEntities.GetEntitiesByName("items");

            var processedComponents = new List<TWComponent>();

            foreach (var component in playerEntity!.GetComponentsByType<ItemActionComponent>())
            {
                processedComponents.Add(component);
                component.Action!(roomEntities!, itemEntities!, playerEntity, outputEntity!, component);
            }

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
