using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;

namespace TextWorld.Core.Misc
{
    public static class Helper
    {
        public static Entity GetPlayersCurrentRoom(Entity playerEntity, List<Entity> roomEntities)
        {
            Entity result = null;
            var roomIdComponent = playerEntity.GetFirstComponentByName<IdComponent>("current room");

            if (roomIdComponent != null)
            {
                result = roomEntities.FirstOrDefault(x => x.Id == roomIdComponent.Id);
            }

            return result;
        }

        public static ItemComponent GetItemComponentFromEntity(Entity currentRoom, string itemName)
        {
            var roomItems = currentRoom.GetComponentsByType<ItemComponent>();

            if (roomItems.Count() > 0)
            {
                var takeItem = roomItems.FirstOrDefault(x => x.Item.Name == itemName);

                if (takeItem != null)
                {
                    return takeItem;
                }
            }

            return null;
        }

        public static ItemComponent GetItemComponentOnEntity(Entity entity, ItemComponent itemComponent)
        {
            return entity.GetComponentsByType<ItemComponent>().FirstOrDefault(x => x.Item.Id == itemComponent.Item.Id);
        }

        public static void AddItemToPlayersInventory(Entity playerEntity, Entity itemOnEntity, ItemComponent itemComponent)
        {
            var inventoryComponent = playerEntity.GetFirstComponentByType<InventoryComponent>();

            if (inventoryComponent != null)
            {
                var itemInInventory = inventoryComponent.Items.FirstOrDefault(x => x.Id == itemComponent.Item.Id);

                if (itemInInventory != null)
                {
                    itemInInventory.Quantity += itemComponent.Item.Quantity;
                }
                else
                {
                    inventoryComponent.AddItem(new InventoryItem()
                    {
                        Id = itemComponent.Item.Id,
                        Quantity = itemComponent.Item.Quantity
                    });
                }

                var itemToRemove = GetItemComponentOnEntity(itemOnEntity, itemComponent);

                if (itemToRemove != null)
                {
                    itemOnEntity.RemoveComponent(itemToRemove);
                }
            }
        }

        public static void AddCommandComponentToEntity(Entity commandEntity, string command)
        {
            if (!string.IsNullOrEmpty(command))
            {
                var commandParts = command.ToLower().Split(" ");

                if (commandParts.Length > 1)
                {
                    commandEntity.AddComponent(new CommandComponent("command", commandParts[0],
                        commandParts.Skip(1).Take(commandParts.Length).ToArray()));
                }
                else
                {
                    commandEntity.AddComponent(new CommandComponent("command", command.ToLower()));
                }
            }
        }
    }
}
