using System;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Misc
{
    public abstract class Item
    {
        public Guid Id { get; } = Guid.NewGuid();
        public string Name { get; private set; }
        public string[] Synonyms { get; protected set; }
        public int Quantity { get; private set; }

        public Item(string name, int quantity)
        {
            Name = name;
            Quantity = quantity;
        }

        public Item(string name, int quantity, string[] synonyms) : this(name, quantity)
        {
            Synonyms = synonyms;
        }

        public abstract void Use(Entity entity);
    }
}
