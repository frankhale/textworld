using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Items
{
    public class HealthPotion : Item
    {
        public int HealthImmediately { get; private set; }

        public HealthPotion(Guid id, string name, int healthImmediately, int quantity, string description, string[] synonyms) : base(id, name, quantity, description, synonyms)
        {
            HealthImmediately = healthImmediately;
        }

        public override void Use(TWEntity entity)
        {
            throw new NotImplementedException();
        }
    }
}
