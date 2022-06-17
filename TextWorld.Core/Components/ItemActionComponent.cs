using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Components
{
    public class ItemActionComponent : TWComponent
    {
        public Guid ItemId { get; private set; }
        public ItemActionType ActionType { get; private set; }
        public Action? Action { get; private set; }

        public string? ItemName { get; private set; }

        public ItemActionComponent(string name, ItemActionType actionType) : base(name)
        {
            ItemId = Guid.NewGuid();
            ActionType = actionType;
        }

        public ItemActionComponent(string name, Guid itemId, ItemActionType actionType) : this(name, actionType)
        {
            ItemId = itemId;
        }

        public ItemActionComponent(string name, Guid itemId, ItemActionType actionType, Action action) : this(name, itemId, actionType)
        {
            Action = action;
        }

        public ItemActionComponent(string name, string itemName, ItemActionType actionType) : this(name, actionType)
        {
            ItemName = itemName;
        }
    }
}
