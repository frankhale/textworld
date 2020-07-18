using System;

namespace TextWorld.Core.Misc
{
    public abstract class Item
    {
        public Guid Id { get; } = Guid.NewGuid();
        public string Name { get; private set; }

        public Item(string name)
        {
            Name = name;
        }

        public abstract void Use(Entity entity);
    }
}
