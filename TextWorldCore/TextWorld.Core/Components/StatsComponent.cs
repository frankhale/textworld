using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class StatsComponent : TWComponent
    {
        public int Health { get; set; }
        public int Magicka { get; set; }
        public int Stamina { get; set; }

        public StatsComponent(string name) : base(name) { }
    }
}
