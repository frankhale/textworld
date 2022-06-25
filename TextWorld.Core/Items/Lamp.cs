using TextWorld.Core.Misc;
using TextWorld.Core.ECS;
using TextWorld.Core.Components;

namespace TextWorld.Core.Items
{
    public class Lamp : Item
    {
        public Lamp(Guid id, string name, string description, string[] synonyms) : base(id, name, description, ItemType.Lamp, synonyms) 
        {
            Consumable = false;
            CanBeDestroyed = true;
        }

        public override void Use(TWEntity entity, List<TWEntity> itemEntities, TWEntity outputEntity)
        {
            outputEntity.AddComponent(new OutputComponent("output for item used", $"You rub the {Name} with all your might but it doesn't seem to do anything", OutputType.Regular));
        }
    }
}
