using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Misc
{
    public static class Helper
    {
        public static TWEntity? GetPlayersCurrentRoom(TWEntity playerEntity, List<TWEntity> roomEntities)
        {
            TWEntity? result = null;
            var roomIdComponent = playerEntity.GetComponentByName<IdComponent>("player current room");

            if (roomIdComponent != null)
            {
                result = roomEntities.FirstOrDefault(x => x.Id == roomIdComponent.Id);
            }

            return result;
        }

        public static ItemComponent? GetItemComponentFromEntity(TWEntity currentRoom, string itemName)
        {
            var roomItems = currentRoom.GetComponentsByType<ItemComponent>();

            if (roomItems.Count > 0)
            {
                var takeItem = roomItems.FirstOrDefault(x => x.Item.Name == itemName);

                if (takeItem != null)
                {
                    return takeItem;
                }
            }

            return null;
        }

        public static ItemComponent? GetItemComponentOnEntity(TWEntity entity, ItemComponent itemComponent)
        {
            return entity.GetComponentsByType<ItemComponent>().FirstOrDefault(x => x.Item.Id == itemComponent.Item.Id);
        }

        public static void AddItemToPlayersInventory(TWEntity playerEntity, TWEntity itemOnEntity, ItemComponent itemComponent)
        {
            var inventoryComponent = playerEntity.GetComponentByType<InventoryComponent>();

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
                        Name = itemComponent.Item.Name,
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

        public static void AddCommandComponentToEntity(TWEntity commandEntity, string command)
        {
            if (!string.IsNullOrEmpty(command))
            {
                var commandParts = command.ToLower().Split(" ");

                if (commandParts.Length > 1)
                {
                    commandEntity.AddComponent(new CommandComponent("add command with args", commandParts[0],
                        commandParts.Skip(1).Take(commandParts.Length).ToArray()));
                }
                else
                {
                    commandEntity.AddComponent(new CommandComponent("add command with no args", command.ToLower()));
                }
            }
        }
    }
}
