namespace TextWorld.Core.ECS
{
    public abstract class Component
    {
        public string Name { get; private set; }

        protected Component(string name)
        {
            Name = name;
        }
    }
}
