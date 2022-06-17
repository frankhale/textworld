using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class CurrencyComponent : TWComponent
    {
        public int Gold { get; set; }

        public CurrencyComponent(string name) : base(name) { }
    }
}
