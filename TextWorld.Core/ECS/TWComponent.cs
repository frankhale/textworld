namespace TextWorld.Core.ECS
{
    public abstract class TWComponent
    {
        public string Name { get; private set; }

        protected TWComponent(string name)
        {
            Name = name;
        }
    }
}
