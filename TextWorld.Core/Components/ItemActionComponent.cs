using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Components
{
    public class ItemActionComponent : TWComponent
    {
        public Guid ItemId { get; private set; }
        public ItemActionType ActionType { get; private set; }
        public CommandComponent CommandComponent { get; private set; }
        public Action<List<TWEntity>, List<TWEntity>, TWEntity, TWEntity, ItemActionComponent>? Action { get; private set; }

        public string? ItemName { get; private set; }
        
        public ItemActionComponent(string name, CommandComponent commandComponent, ItemActionType actionType) : base(name)
        {
            ItemId = Guid.NewGuid();
            ActionType = actionType;
            CommandComponent = commandComponent;
        }

        public ItemActionComponent(string name, CommandComponent commandComponent, ItemActionType actionType, Action<List<TWEntity>, List<TWEntity>, TWEntity, TWEntity, ItemActionComponent> action) : this(name, commandComponent, actionType)
        {
            ItemId = Guid.NewGuid();
            Action = action;
        }

        public ItemActionComponent(string name, Guid itemId, CommandComponent commandComponent, ItemActionType actionType) : this(name, commandComponent, actionType)
        {
            ItemId = itemId;
        }

        public ItemActionComponent(string name, Guid itemId, CommandComponent commandComponent, ItemActionType actionType, Action<List<TWEntity>, List<TWEntity>, TWEntity, TWEntity, ItemActionComponent> action) : this(name, itemId, commandComponent, actionType)
        {
            Action = action;
        }

        public ItemActionComponent(string name, string itemName, CommandComponent commandComponent, ItemActionType actionType) : this(name, commandComponent, actionType)
        {
            ItemName = itemName;
        }

        public ItemActionComponent(string name, string itemName, CommandComponent commandComponent, ItemActionType actionType, Action<List<TWEntity>, List<TWEntity>, TWEntity, TWEntity, ItemActionComponent> action) : this(name, itemName, commandComponent, actionType)
        {
            Action = action;
        }
    }
}
