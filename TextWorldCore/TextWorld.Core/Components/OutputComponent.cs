namespace TextWorld.Core.Components
{
    public class OutputComponent : Component
    {
        public string Value { get; private set; }

        public OutputComponent(string name, string value) : base(name)
        {
            Value = value;
        }
    }
}
