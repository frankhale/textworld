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

        public override void Use(TWEntity player, List<TWEntity> itemEntities, TWEntity outputEntity)
        {
            var healthComponent = player.GetComponentByType<HealthComponent>();
            if (healthComponent != null && healthComponent.CurrentHealth < healthComponent.MaxHealth)
            {
                healthComponent.CurrentHealth += HealthImmediately;
                if (healthComponent.CurrentHealth > healthComponent.MaxHealth)
                {
                    healthComponent.CurrentHealth = healthComponent.MaxHealth;
                }
                
                outputEntity.AddComponent(new OutputComponent("output for item used", $"{Name} used: +{HealthImmediately} health", OutputType.Regular));
            }
        }
    }
}
