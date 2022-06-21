using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class HealthComponent : TWComponent
    {
        public int CurrentHealth { get; set; }
        public int MaxHealth { get; set; }

        public HealthComponent(string name, int currentHealth, int maxHealth) : base(name) 
        {
            CurrentHealth = currentHealth;
            MaxHealth = maxHealth;
        }
    }
}
