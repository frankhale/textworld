using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class InventorySystem : TWSystem
    {
        public override void Run(TWEntity commandEntity, TWEntity playerEntity, TWEntity outputEntity)
        {
            var processedComponents = new List<CommandComponent>();

            foreach (var commandComponent in commandEntity.GetComponentsByType<CommandComponent>())
            {
                var command = commandComponent.Command!.ToLower();

                if (command == "inv" || command == "inventory")
                {
                    processedComponents.Add(commandComponent);

                    // get the players inventory component
                    var inventoryComponent = playerEntity.GetComponentByType<InventoryComponent>();

                    if (inventoryComponent != null)
                    {
                        var itemsAsString = inventoryComponent.GetItemsAsString();

                        if (string.IsNullOrEmpty(itemsAsString))
                        {
                            outputEntity.AddComponent(new OutputComponent("show player inventory", "You don't have any items in your inventory", OutputType.Regular));
                        }
                        else
                        {
                            outputEntity.AddComponent(new OutputComponent("show player inventory", $"inventory: {itemsAsString}", OutputType.Regular));
                        }
                    }
                }
            }

            commandEntity.RemoveComponents(processedComponents);
        }
    }
}
