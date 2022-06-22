using TextWorld.Core.ECS;

namespace TextWorld.Core.Misc
{
    public class Item
    {
        // FIXME: Not all properties here are currently being honored

        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public string[] Synonyms { get; protected set; }
        public int Quantity { get; set; }
        public string Description { get; private set; }
        public bool IsContainer { get; private set; }
        public ItemType ItemType { get; private set; }

        public Item(Guid id, string name, int quantity, string description, ItemType itemType, string[] synonyms)
        {
            Id = id;
            Name = name;
            Quantity = quantity;
            Description = description;
            Synonyms = synonyms;
            ItemType = ItemType;
        }

        public Item(Guid id, string name, int quantity, string description, ItemType itemType, bool isContainer)
        {
            Id = id;
            Name = name;
            Quantity = quantity;
            Description = description;
            Synonyms = Array.Empty<string>();
            IsContainer = isContainer;
            ItemType = ItemType;
        }

        public Item(Guid id, string name, int quantity, string description, ItemType itemType, string[] synonyms, bool isContainer)
        {
            Id = id;
            Name = name;
            Quantity = quantity;
            Description = description;
            Synonyms = synonyms;
            IsContainer = isContainer;
            ItemType = ItemType;
        }

        public virtual void Use(TWEntity entity) { }
    }
}
