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

        public static ItemDropComponent? GetItemDropComponentFromEntity(TWEntity entity, string itemName)
        {
            var items = entity.GetComponentsByType<ItemDropComponent>();

            if (items.Count > 0)
            {
                var takeItem = items.FirstOrDefault(x => x.Item.Name == itemName);

                if (takeItem != null)
                {
                    return takeItem;
                }
            }

            return null;
        }

        public static void AddItemToPlayersInventory(TWEntity playerEntity, TWEntity itemOnEntity, ItemDropComponent itemDropComponent)
        {
            var inventoryComponent = playerEntity.GetComponentByType<InventoryComponent>();

            if (inventoryComponent != null)
            {
                var itemInInventory = inventoryComponent.Items.FirstOrDefault(x => x.Id == itemDropComponent.Item.Id);

                if (itemInInventory != null)
                {
                    itemInInventory.Quantity += itemDropComponent.Item.Quantity;
                }
                else
                {
                    inventoryComponent.AddItem(
                        new InventoryItem
                        {
                            Id = itemDropComponent.Item.Id,
                            Name = itemDropComponent.Item.Name,
                            Quantity = itemDropComponent.Item.Quantity
                        }
                    );
                }

                var itemToRemove = itemOnEntity.GetComponentsByType<ItemDropComponent>().FirstOrDefault(x => x.Item.Id == itemDropComponent.Item.Id);

                if (itemToRemove != null)
                {
                    itemOnEntity.RemoveComponent(itemToRemove);
                }
            }
        }

        public static void RemoveOrDecrementItemFromPlayersInventory(TWEntity playerEntity, TWEntity itemOnEntity, InventoryItem inventoryItem)
        {
            var inventoryComponent = playerEntity.GetComponentByType<InventoryComponent>();

            if (inventoryComponent != null)
            {
                var itemInInventory = inventoryComponent.Items.FirstOrDefault(x => x.Id == inventoryItem.Id);

                if (itemInInventory != null)
                {
                    itemInInventory.Quantity--;
                }

                if (itemInInventory != null && itemInInventory.Quantity <= 0)
                {
                    inventoryComponent.RemoveItem(itemInInventory);
                }
            }
        }

        public static void AddCommandComponentToEntity(TWEntity commandEntity, string command)
        {
            if (!string.IsNullOrEmpty(command))
            {
                commandEntity.AddComponent(new CommandComponent("add command", command.ToLower()));
            }
        }

        public static void ShowItemAction(List<TWEntity> roomEntities, List<TWEntity> itemEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            // TODO: Show item only shows if its on the room entity. We need to support showing items in the players inventory.

            var roomEntity = GetPlayersCurrentRoom(playerEntity, roomEntities);

            var showItem = Helper.GetItemDropComponentFromEntity(roomEntity!, component.ItemName ?? string.Empty);

            if (showItem != null)
            {
                outputEntity.AddComponent(new OutputComponent("output for item in room", $"{showItem.Item.Name} ({showItem.Item.Quantity})", OutputType.Regular));
            }
            else
            {
                outputEntity.AddComponent(new OutputComponent("output for item in room", "That item does not exist here", OutputType.Regular));
            }
        }

        public static void ShowAllItemAction(List<TWEntity> roomEntities, List<TWEntity> itemEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            // TODO: Show item only shows if its on the room entity. We need to support showing items in the players inventory.

            var roomEntity = GetPlayersCurrentRoom(playerEntity, roomEntities);
            var itemDropComponents = roomEntity!.GetComponentsByType<ItemDropComponent>();

            var items = new List<string>();

            itemDropComponents.ForEach(item => items.Add($"{item.Item.Name} ({item.Item.Quantity})"));

            if (items.Count > 0)
            {
                outputEntity.AddComponent(new OutputComponent("output for items in room", $"The following items are here: {string.Join(", ", items.ToArray())}", OutputType.Regular));
            }
            else
            {
                outputEntity.AddComponent(new OutputComponent("output for no items in room", "There are no items here.", OutputType.Regular));
            }
        }

        public static void TakeItemAction(List<TWEntity> roomEntities, List<TWEntity> itemEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            var roomEntity = GetPlayersCurrentRoom(playerEntity, roomEntities);
            var takeItem = Helper.GetItemDropComponentFromEntity(roomEntity!, component.ItemName ?? string.Empty);

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

        public static void TakeAllItemsAction(List<TWEntity> roomEntities, List<TWEntity> itemEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            var roomEntity = GetPlayersCurrentRoom(playerEntity, roomEntities);
            var roomItems = roomEntity!.GetComponentsByType<ItemDropComponent>();

            if (roomItems.Count > 0)
            {
                roomItems.ForEach(item =>
                {
                    Helper.AddItemToPlayersInventory(playerEntity, roomEntity!, item);
                    outputEntity.AddComponent(new OutputComponent("output for item taken", $"You've taken {item.Item.Name}", OutputType.Regular));
                });
            }
            else
            {
                outputEntity.AddComponent(new OutputComponent("output for non existant item", $"Can't find any items here.", OutputType.Regular));
            }
        }

        public static void DropItemAction(List<TWEntity> roomEntities, List<TWEntity> itemEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            // look at player inventory to make sure item exists
            var inventoryComponent = playerEntity.GetComponentByType<InventoryComponent>();

            if (inventoryComponent != null)
            {
                // create a variable that is the item name, it's stored in the itemActionComponent.CommandComponent.Args
                // search inventoryComponent.Items for itemName
                var itemInInventory = inventoryComponent.Items.FirstOrDefault(x => x.Name == component.ItemName);

                // if item exists then look the item up in the itemEntities
                if (itemInInventory != null)
                {
                    // get the item entity from the itemEntities
                    var itemEntity = itemEntities.FirstOrDefault(x => x.GetComponentByType<ItemComponent>()?.Item.Name == component.ItemName);

                    if (itemEntity != null)
                    {
                        var itemComponent = itemEntity.GetComponentByType<ItemComponent>();

                        if (itemComponent != null)
                        {
                            var currentRoomEntity = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);

                            if (currentRoomEntity != null)
                            {
                                var itemExistsInRoom = currentRoomEntity.GetComponentsByType<ItemDropComponent>().Where(x => x.Item.Id == itemComponent.Item.Id).FirstOrDefault();

                                if (itemExistsInRoom != null)
                                {
                                    itemExistsInRoom.Item.Quantity += itemInInventory.Quantity;
                                }
                                else
                                {
                                    currentRoomEntity.AddComponent(new ItemDropComponent($"item drop component", new InventoryItem
                                    {
                                        Id = itemInInventory.Id,
                                        Name = itemInInventory.Name,
                                        Quantity = itemInInventory.Quantity
                                    }));
                                }
                            }

                            inventoryComponent.RemoveItem(itemInInventory);

                            outputEntity.AddComponent(new OutputComponent("output for drop item", $"You dropped {component.ItemName}", OutputType.Regular));
                        }
                    }
                }
                else
                {
                    outputEntity.AddComponent(new OutputComponent("output for drop item not found", $"You don't have a {component.ItemName} to drop", OutputType.Regular));
                }
            }
        }

        public static void DropAllItemsAction(List<TWEntity> roomEntities, List<TWEntity> itemEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            var currentRoomEntity = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);
            var inventoryComponent = playerEntity.GetComponentByType<InventoryComponent>();

            if (inventoryComponent != null && inventoryComponent.Items.Count > 0)
            {
                foreach (var itemInInventory in inventoryComponent.Items)
                {
                    if (currentRoomEntity != null)
                    {
                        var itemExistsInRoom = currentRoomEntity.GetComponentsByType<ItemDropComponent>().Where(x => x.Item.Id == itemInInventory.Id).FirstOrDefault();

                        if (itemExistsInRoom != null)
                        {
                            itemExistsInRoom.Item.Quantity += itemInInventory.Quantity;
                        }
                        else
                        {
                            currentRoomEntity.AddComponent(new ItemDropComponent($"item drop component", new InventoryItem
                            {
                                Id = itemInInventory.Id,
                                Name = itemInInventory.Name,
                                Quantity = itemInInventory.Quantity
                            }));
                        }
                    }

                }

                outputEntity.AddComponent(new OutputComponent("output for drop item", $"You dropped {component.ItemName} items", OutputType.Regular));
                inventoryComponent.RemoveAllItems();
            }
            else
            {
                outputEntity.AddComponent(new OutputComponent("output for drop all items", $"You don't have any items to drop", OutputType.Regular));
            }
        }

        public static void UseItemFromInventoryAction(List<TWEntity> roomEntities, List<TWEntity> itemEntities, TWEntity playerEntity, TWEntity outputEntity, ItemActionComponent component)
        {
            // look at player inventory to make sure item exists
            var inventoryComponent = playerEntity.GetComponentByType<InventoryComponent>();

            if (inventoryComponent != null)
            {
                // create a variable that is the item name, it's stored in the itemActionComponent.CommandComponent.Args
                // search inventoryComponent.Items for itemName
                var itemInInventory = inventoryComponent.Items.FirstOrDefault(x => x.Name == component.ItemName);

                // if item exists then look the item up in the itemEntities
                if (itemInInventory != null)
                {
                    // get the item entity from the itemEntities
                    var itemEntity = itemEntities.FirstOrDefault(x => x.GetComponentByType<ItemComponent>()?.Item.Name == component.ItemName);

                    if (itemEntity != null)
                    {
                        var itemComponent = itemEntity.GetComponentByType<ItemComponent>();

                        if (itemComponent != null)
                        {
                            itemComponent.Item.Use(playerEntity, itemEntities, outputEntity);
                            //outputEntity.AddComponent(new OutputComponent("output for item used", $"You used {itemName}", OutputType.Regular));

                            // if the item is consumable then execute it's Use function
                            if (itemComponent.Item.Consumable)
                            {
                                Helper.RemoveOrDecrementItemFromPlayersInventory(playerEntity, playerEntity, itemInInventory);
                            }
                            //else
                            //{
                            //    outputEntity.AddComponent(new OutputComponent("output for item not used", $"You can't use {itemName}", OutputType.Regular));
                            //}
                        }
                    }
                }
                else
                {
                    outputEntity.AddComponent(new OutputComponent("output for item not found", $"You don't have a {component.ItemName}", OutputType.Regular));
                }
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
