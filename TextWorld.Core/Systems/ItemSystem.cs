using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ItemSystem : TWSystem
    {
        public override void Run(TWEntity playerEntity, List<TWEntity> roomEntities, TWEntity outputEntity)
        {
            var processedComponents = new List<TWComponent>();

            foreach (var component in playerEntity.GetComponentsByType<ItemActionComponent>())
            {
                processedComponents.Add(component);

                var roomEntity = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);

                if (roomEntity != null)
                {
                    if (component.ActionType == ItemActionType.Show)
                    {
                        if (string.IsNullOrEmpty(component.ItemName)) return;

                        var showItem = Helper.GetItemComponentFromEntity(roomEntity, component.ItemName);

                        if (showItem != null)
                        {
                            outputEntity.AddComponent(new OutputComponent("output for item in room", $"{showItem.Item.Name} ({showItem.Item.Quantity})", OutputType.Regular));
                        }
                        else
                        {
                            outputEntity.AddComponent(new OutputComponent("output for item in room", "That item does not exist here", OutputType.Regular));
                        }
                    }
                    else if (component.ActionType == ItemActionType.ShowAll)
                    {
                        var itemComponents = roomEntity.GetComponentsByType<ItemComponent>();

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
                    else if (component.ActionType == ItemActionType.Take)
                    {
                        if (string.IsNullOrEmpty(component.ItemName)) return;

                        var takeItem = Helper.GetItemComponentFromEntity(roomEntity, component.ItemName);

                        if (takeItem != null)
                        {
                            Helper.AddItemToPlayersInventory(playerEntity, roomEntity, takeItem);

                            outputEntity.AddComponent(new OutputComponent("output for item taken", $"You've taken {component.ItemName}", OutputType.Regular));
                        }
                        else
                        {
                            outputEntity.AddComponent(new OutputComponent("output for non existant item", $"{component.ItemName} does not exist here.", OutputType.Regular));
                        }
                    }
                    else if (component.ActionType == ItemActionType.Drop)
                    { }
                    else if (component.ActionType == ItemActionType.Use)
                    { }
                }
            }

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
