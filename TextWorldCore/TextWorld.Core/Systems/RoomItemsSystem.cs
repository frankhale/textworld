using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class RoomItemsSystem : System
    {
        public override void Run(Entity playerEntity, List<Entity> roomEntities, Entity outputEntity)
        {
            var processedComponents = new List<Component>();

            foreach (var component in playerEntity.Components
                .Where(x => x.GetType() == typeof(ShowItemsComponent)))
            {
                processedComponents.Add(component);

                var roomEntity = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);

                if (roomEntity != null)
                {
                    var itemComponents = roomEntity.GetComponentsByType<ItemComponent>();

                    var items = new List<string>();

                    itemComponents.ForEach(item => items.Add(item.Item.Name));

                    if (items.Count() > 0)
                    {
                        outputEntity.AddComponent(new OutputComponent("output", $"The following items are here: {string.Join(", ", items.ToArray())}"));
                    }
                    else
                    {
                        outputEntity.AddComponent(new OutputComponent("output", $"There are no items here."));
                    }
                }
            }

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
