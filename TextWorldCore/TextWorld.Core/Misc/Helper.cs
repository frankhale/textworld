using System;
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

        public static ItemComponent GetItemComponentInPlayersCurrentRoom(Entity playerEntity, List<Entity> roomEntities, string itemName)
        {
            var playerCurrentRoom = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);

            if (playerCurrentRoom != null)
            {
                var roomItems = playerCurrentRoom.GetComponentsByType<ItemComponent>();

                if (roomItems.Count() > 0)
                {
                    var takeItem = roomItems.FirstOrDefault(x => x.Item.Name == itemName);

                    if (takeItem != null)
                    {
                        return takeItem;
                    }
                }
            }

            return null;
        }

        public static void AddItemToPlayersInventory(Entity playerEntity, ItemComponent itemComponent)
        {
            var inventoryComponent = playerEntity.GetFirstComponentByType<InventoryComponent>();

            if(inventoryComponent != null)
            {
                // look at the players inventory and see if the item is already in there
                // if item is already in there increment the item quanity

                throw new NotImplementedException();
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
