using TextWorld.Core.Data;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class StatsComponent : TWComponent
    {
        public Stat Health { get; set; }
        public Stat Magicka { get; set; }
        public Stat Stamina { get; set; }

        public StatsComponent(string name, Stat health, Stat magicka, Stat stamina) : base(name)
        {
            Health = health;
            Magicka = magicka;
            Stamina = stamina;
        }
    }
}
