using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ItemSystem : System
    {
        public override void Run(Entity playerEntity, List<Entity> roomEntities, Entity outputEntity)
        {
            var processedComponents = new List<Component>();

            foreach (var component in playerEntity.GetComponentsByType<ItemActionComponent>())
            {
                processedComponents.Add(component);

                var roomEntity = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);

                if (roomEntity != null)
                {
                    if (component.Action == ItemAction.ShowAll)
                    {
                        var itemComponents = roomEntity.GetComponentsByType<ItemComponent>();

                        var items = new List<string>();

                        itemComponents.ForEach(item => items.Add($"{item.Item.Name} ({item.Item.Quantity})"));

                        if (items.Count() > 0)
                        {
                            outputEntity.AddComponent(new OutputComponent("output", $"The following items are here: {string.Join(", ", items.ToArray())}"));
                        }
                        else
                        {
                            outputEntity.AddComponent(new OutputComponent("output", "There are no items here."));
                        }
                    }
                    else if (component.Action == ItemAction.Take)
                    {
                        var takeItem = Helper.GetItemComponentInPlayersCurrentRoom(playerEntity, roomEntities, component.ItemName);

                        if (takeItem != null)
                        {
                            outputEntity.AddComponent(new OutputComponent("output", $"TODO: add {component.ItemName} to player inventory."));
                        }
                        else
                        {
                            outputEntity.AddComponent(new OutputComponent("output", $"{component.ItemName} does not exist here."));
                        }
                    }
                }
            }

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
