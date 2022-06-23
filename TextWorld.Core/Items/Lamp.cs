using TextWorld.Core.Misc;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Items
{
    public class Lamp : Item
    {
        public Lamp(Guid id, string name, string description, string[] synonyms) : base(id, name, description, ItemType.Lamp, synonyms) 
        {
            Consumable = true;
            CanBeDestroyed = true;
        }

        public override void Use(TWEntity entity, List<TWEntity> itemEntities, TWEntity outputEntity)
        {
            throw new NotImplementedException();
        }
    }
}
