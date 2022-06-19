using TextWorld.Core.ECS;

namespace TextWorld.Core.Misc
{
    public abstract class Item
    {
        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public string[]? Synonyms { get; protected set; }
        public int Quantity { get; private set; }

        public Item(Guid id, string name, int quantity)
        {
            Id = id;
            Name = name;
            Quantity = quantity;
        }

        public Item(Guid id, string name, int quantity, string[] synonyms) : this(id, name, quantity)
        {
            Synonyms = synonyms;
        }

        //TODO: We are going to need a way to define multiple Use functions.
        // probably using a dictionary of "name" and "Actions"

        public abstract void Use(TWEntity entity);
    }
}
