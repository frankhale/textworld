using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Items
{
    public class HealthPotion : Item
    {
        public int HealthImmediately { get; private set; }

        public HealthPotion(string name, int healthImmediately, int quantity) : base(name, quantity)
        {
            HealthImmediately = healthImmediately;
        }

        public override void Use(TWEntity entity)
        {
            throw new NotImplementedException();
        }
    }
}
