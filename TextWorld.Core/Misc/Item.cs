using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Misc
{
    public abstract class Item
    {
        // FIXME: Not all properties here are currently being honored

        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public string[] Synonyms { get; protected set; }        
        public string Description { get; private set; }
        public bool IsContainer { get; protected set; }
        public ItemType ItemType { get; private set; }
        public bool CanBeDestroyed { get; protected set; }
        public bool Consumable { get; protected set; }

        public Item(Guid id, string name, string description, ItemType itemType, string[] synonyms)
        {
            Id = id;
            Name = name;            
            Description = description;
            Synonyms = synonyms;
            ItemType = itemType;
        }

        public Item(Guid id, string name, string description, ItemType itemType, bool isContainer)
        {
            Id = id;
            Name = name;            
            Description = description;
            Synonyms = Array.Empty<string>();
            IsContainer = isContainer;
            ItemType = itemType;
        }

        public Item(Guid id, string name, string description, ItemType itemType, string[] synonyms, bool isContainer)
        {
            Id = id;
            Name = name;            
            Description = description;
            Synonyms = synonyms;
            IsContainer = isContainer;
            ItemType = itemType;
        }
        
        public virtual void Use(TWEntity entity, List<TWEntity> entities, TWEntity outputEntity)
        {
            outputEntity.AddComponent(new OutputComponent("output for item used", $"Hmm, nothing happened", OutputType.Regular));
        }
    }
}