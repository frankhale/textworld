using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Items
{
    public class HealthPotion : Item
    {
        public int HealthImmediately { get; private set; }

        public HealthPotion(Guid id, string name, int healthImmediately, string description, string[] synonyms) : base(id, name, description, ItemType.HealthPotion, synonyms)
        {
            HealthImmediately = healthImmediately;
            Consumable = true;
            CanBeDestroyed = true;
        }

        public override void Use(TWEntity player, List<TWEntity> itemEntities)
        {
            var inventoryComponent = player.GetComponentByType<InventoryComponent>();
            
            if (inventoryComponent != null)
            {
                var itemInInventory = inventoryComponent.Items.FirstOrDefault(x => x.Id == Id);

                if (itemInInventory != null)
                {
                    var itemEntity = itemEntities.FirstOrDefault(x => x.GetComponentByType<ItemComponent>()?.Item.Id == Id);
                    var healthPotion = itemEntity?.GetComponentByType<ItemComponent>()?.Item as HealthPotion;

                    var healthComponent = player.GetComponentByType<HealthComponent>();
                    if (healthComponent != null && healthComponent.CurrentHealth < healthComponent.MaxHealth)
                    {
                        healthComponent.CurrentHealth += HealthImmediately;
                        if (healthComponent.CurrentHealth > healthComponent.MaxHealth)
                        {
                            healthComponent.CurrentHealth = healthComponent.MaxHealth;
                        }

                        Helper.RemoveOrDecrementItemFromPlayersInventory(player, player, itemInInventory);
                    }
                }
            }
        }
    }
}
