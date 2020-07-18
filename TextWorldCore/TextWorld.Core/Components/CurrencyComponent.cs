namespace TextWorld.Core.Components
{
    public class CurrencyComponent : Component
    {
        public int Gold { get; set; }

        public CurrencyComponent(string name) : base(name) { }
    }
}
