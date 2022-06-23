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

        public override void Use(TWEntity player, List<TWEntity> itemEntities, TWEntity itemEntity)
        {
            var healthPotion = itemEntity?.GetComponentByType<ItemComponent>()?.Item as HealthPotion;

            var healthComponent = player.GetComponentByType<HealthComponent>();
            if (healthPotion != null && healthComponent != null && healthComponent.CurrentHealth < healthComponent.MaxHealth)
            {
                healthComponent.CurrentHealth += healthPotion.HealthImmediately;
                if (healthComponent.CurrentHealth > healthComponent.MaxHealth)
                {
                    healthComponent.CurrentHealth = healthComponent.MaxHealth;
                }
            }
        }
    }
}
