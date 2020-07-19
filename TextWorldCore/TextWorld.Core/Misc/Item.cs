using System;

namespace TextWorld.Core.Misc
{
    public abstract class Item
    {
        public Guid Id { get; } = Guid.NewGuid();
        public string Name { get; private set; }
        public string[] Synonyms { get; protected set; }

        public Item(string name)
        {
            Name = name;
        }

        public Item(string name, string[] synonyms) : this(name)
        {
            Synonyms = synonyms;
        }

        public abstract void Use(Entity entity);
    }
}
