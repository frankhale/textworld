using TextWorld.Core.Misc;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Items
{
    public class Lamp : Item
    {
        public Lamp(Guid id, string name, int quantity) : base(id, name, quantity) { }

        public override void Use(TWEntity entity)
        {
            throw new NotImplementedException();
        }
    }
}
