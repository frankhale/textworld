namespace TextWorld.Core
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
