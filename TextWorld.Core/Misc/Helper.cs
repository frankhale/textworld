using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Misc
{
    public static class Helper
    {
        public static Guid FindGuidForEntity(List<TWEntity> entities, string entityName)
        {
            var entity = entities.FirstOrDefault(x => x.Name == entityName);

            if (entity != null)
            {
                return entity.Id;
            }

            return Guid.Empty;
        }

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

        public static void DeleteItemFromPlayersInventory(TWEntity playerEntity, TWEntity itemOnEntity, ItemComponent itemComponent)
        {
            var inventoryComponent = playerEntity.GetComponentByType<InventoryComponent>();

            if (inventoryComponent != null)
            {
                var itemInInventory = inventoryComponent.Items.FirstOrDefault(x => x.Id == itemComponent.Item.Id);

                if (itemInInventory != null)
                {
                    itemInInventory.Quantity -= itemComponent.Item.Quantity;
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

        public static void ShowItemAction(List<TWEntity> roomEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            var roomEntity = GetPlayersCurrentRoom(playerEntity, roomEntities);

            var showItem = Helper.GetItemComponentFromEntity(roomEntity!, component.ItemName ?? string.Empty);

            if (showItem != null)
            {
                outputEntity.AddComponent(new OutputComponent("output for item in room", $"{showItem.Item.Name} ({showItem.Item.Quantity})", OutputType.Regular));
            }
            else
            {
                outputEntity.AddComponent(new OutputComponent("output for item in room", "That item does not exist here", OutputType.Regular));
            }
        }

        public static void ShowAllItemAction(List<TWEntity> roomEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            var roomEntity = GetPlayersCurrentRoom(playerEntity, roomEntities);
            var itemComponents = roomEntity!.GetComponentsByType<ItemComponent>();

            var items = new List<string>();

            itemComponents.ForEach(item => items.Add($"{item.Item.Name} ({item.Item.Quantity})"));

            if (items.Count > 0)
            {
                outputEntity.AddComponent(new OutputComponent("output for items in room", $"The following items are here: {string.Join(", ", items.ToArray())}", OutputType.Regular));
            }
            else
            {
                outputEntity.AddComponent(new OutputComponent("output for no items in room", "There are no items here.", OutputType.Regular));
            }
        }

        public static void TakeItemAction(List<TWEntity> roomEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            var roomEntity = GetPlayersCurrentRoom(playerEntity, roomEntities);
            var takeItem = Helper.GetItemComponentFromEntity(roomEntity!, component.ItemName ?? string.Empty);

            if (takeItem != null)
            {
                Helper.AddItemToPlayersInventory(playerEntity, roomEntity!, takeItem);

                outputEntity.AddComponent(new OutputComponent("output for item taken", $"You've taken {component.ItemName}", OutputType.Regular));
            }
            else
            {
                var itemName = string.IsNullOrEmpty(component.ItemName) ? "that item" : component.ItemName;
                outputEntity.AddComponent(new OutputComponent("output for non existant item", $"{itemName} does not exist here.", OutputType.Regular));
            }
        }
    
        public static ShowDescriptionComponent GetRoomExitInfoForRoom(TWEntity playerEntity, List<TWEntity> roomEntities, TWEntity roomEntity)
        {
            var newRoomExits = roomEntity!.GetComponentsByType<ExitComponent>();
            var exitDictionary = newRoomExits.ToDictionary(x => x.RoomId);
            var exitRooms = roomEntities.Where(x => exitDictionary.TryGetValue(x.Id, out var e) && !e.Hidden).ToList();
            var exitInfo = exitRooms.Select(x => $"{exitDictionary[x.Id].Direction} -> {x.Name}".ToString()).ToList();            
            return new ShowDescriptionComponent($"Exits: {string.Join(", ", exitInfo)}", exitRooms, DescriptionType.Exit);
        }
    }
}
