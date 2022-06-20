using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class CurrencyComponent : TWComponent
    {
        public int Coins { get; set; }

        public CurrencyComponent(string name, int coins) : base(name) 
        {
            Coins = coins;
        }
    }
}
