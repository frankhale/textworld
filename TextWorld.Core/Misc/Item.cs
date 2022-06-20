using TextWorld.Core.ECS;

namespace TextWorld.Core.Misc
{
    public abstract class Item
    {
        // FIXME: Not all properties here are currently being honored

        public Guid Id { get; private set; }
        public string Name { get; private set; }        
        public string[] Synonyms { get; protected set; }
        public int Quantity { get; private set; }
        public string Description { get; private set; }
        public bool IsContainer { get; private set; }

        public Item(Guid id, string name, int quantity, string description, string[] synonyms)
        {
            Id = id;
            Name = name;
            Quantity = quantity;
            Description = description;
            Synonyms = synonyms;
        }

        public Item(Guid id, string name, int quantity, string description, bool isContainer)
        {
            Id = id;
            Name = name;
            Quantity = quantity;
            Description = description;
            Synonyms = Array.Empty<string>();
            IsContainer = isContainer;
        }

        public Item(Guid id, string name, int quantity, string description, string[] synonyms, bool isContainer)
        {
            Id = id;
            Name = name;
            Quantity = quantity;
            Description = description;
            Synonyms = synonyms;
            IsContainer = isContainer;            
        }

        public abstract void Use(TWEntity entity);
    }
}
