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
        }

        public override void Use(TWEntity entity)
        {
            var inventoryComponent = entity.GetComponentByType<InventoryComponent>();

            if (inventoryComponent != null)
            {
                //var healthPotion = inventoryComponent.Items.FirstOrDefault(x => x.ItemType == ItemType.HealthPotion);

                //var healthComponent = entity.GetComponentByType<HealthComponent>();
                //if (healthComponent != null && healthComponent.CurrentHealth < HealthImmediately)
                //{
                //    healthComponent.CurrentHealth += HealthImmediately;
                //    if (healthComponent.CurrentHealth > healthComponent.MaxHealth)
                //    {
                //        healthComponent.CurrentHealth = healthComponent.MaxHealth;
                //    }

                //    //Helper.RemoveOrDecrementItemFromPlayersInventory(entity, entity, )
                //}
            }
        }
    }
}
