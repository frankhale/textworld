using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Items
{
    public class HealthPotion : Item
    {
        public int HealthImmediately { get; private set; }

        public HealthPotion(Guid id, string name, int healthImmediately, int quantity, string description, string[] synonyms) : base(id, name, quantity, description, ItemType.HealthPotion, synonyms)
        {
            HealthImmediately = healthImmediately;
        }

        public override void Use(TWEntity entity)
        {
            // FIXME: We need to figure out how we are storing items in inventory relative
            // to the items we read in via game data. There is some discontinuity as we
            // will need to be able to use the specific types later but we are only storing
            // base item types in the inventory. I need to sleep on it!

            //var inventoryComponent = entity.GetComponentByType<InventoryComponent>();

            //if (inventoryComponent != null)
            //{
            //    var healthPotion = inventoryComponent.Items.FirstOrDefault(x => x.ItemType == ItemType.HealthPotion);

            //    var healthComponent = entity.GetComponentByType<HealthComponent>();
            //    if (healthComponent != null && healthComponent.CurrentHealth < HealthImmediately)
            //    {
            //        healthComponent.CurrentHealth += HealthImmediately;
            //        if (healthComponent.CurrentHealth > healthComponent.MaxHealth)
            //        {
            //            healthComponent.CurrentHealth = healthComponent.MaxHealth;
            //        }

            //        //Helper.RemoveOrDecrementItemFromPlayersInventory(entity, entity, )
            //    }
            //}
        }
    }
}
