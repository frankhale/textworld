using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Components
{
    public class ItemComponent : TWComponent
    {
        public Item Item { get; private set; }

        public ItemComponent(string name, Item item) : base(name)
        {
            Item = item;
        }
    }
}
