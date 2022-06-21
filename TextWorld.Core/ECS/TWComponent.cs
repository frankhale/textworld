namespace TextWorld.Core.ECS
{
    public abstract class TWComponent
    {
        public Guid Id { get; set; }
        public string Name { get; private set; }

        protected TWComponent(string name) : this(name, Guid.NewGuid()) { }

        protected TWComponent(string name, Guid id)
        {
            Name = name;
            Id = id;
        }
    }
}
