using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class HealthComponent : TWComponent
    {
        public int Health { get; set; }
        public int MaxHealth { get; set; }

        public HealthComponent(string name, int health, int maxHealth) : base(name) 
        {
            Health = health;
            MaxHealth = maxHealth;
        }
    }
}
