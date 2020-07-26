using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ItemSystem : ECS.System
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
                            outputEntity.AddComponent(new OutputComponent("output for items in room", $"The following items are here: {string.Join(", ", items.ToArray())}"));
                        }
                        else
                        {
                            outputEntity.AddComponent(new OutputComponent("output for no items in room", "There are no items here."));
                        }
                    }
                    else if (component.Action == ItemAction.Take)
                    {
                        var takeItem = Helper.GetItemComponentFromEntity(roomEntity, component.ItemName);

                        if (takeItem != null)
                        {
                            Helper.AddItemToPlayersInventory(playerEntity, roomEntity, takeItem);

                            outputEntity.AddComponent(new OutputComponent("output for item taken", $"You've taken {component.ItemName}"));
                        }
                        else
                        {
                            outputEntity.AddComponent(new OutputComponent("output for non existant item", $"{component.ItemName} does not exist here."));
                        }
                    }
                }
            }

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
