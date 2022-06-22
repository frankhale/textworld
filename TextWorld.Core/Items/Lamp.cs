using TextWorld.Core.Misc;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Items
{
    public class Lamp : Item
    {
        public Lamp(Guid id, string name, int quantity, string description, string[] synonyms) : base(id, name, quantity, description, ItemType.Lamp, synonyms) { }

        public override void Use(TWEntity entity)
        {
            throw new NotImplementedException();
        }
    }
}
