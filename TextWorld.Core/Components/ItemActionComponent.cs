using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Components
{
    public class ItemActionComponent : TWComponent
    {
        public Guid ItemId { get; private set; }
        public ItemAction Action { get; private set; }
        public string? ItemName { get; private set; }

        public ItemActionComponent(string name, ItemAction action) : base(name)
        {
            Action = action;
        }

        public ItemActionComponent(string name, Guid itemId, ItemAction action) : this(name, action)
        {
            ItemId = itemId;
        }

        public ItemActionComponent(string name, string itemName, ItemAction action) : this(name, action)
        {
            ItemName = itemName;
        }
    }
}
