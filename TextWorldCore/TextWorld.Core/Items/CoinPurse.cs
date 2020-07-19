using TextWorld.Core.Components;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Items
{
    public class CoinPurse : Item
    {
        public int NumberOfCoins { get; private set; }

        public CoinPurse(string name, int numberOfCoins) : base(name)
        {
            NumberOfCoins = numberOfCoins;
            Synonyms = new string[] { "purse", "coin purse", "coins" };
        }

        public override void Use(Entity entity)
        {
            var currencyComponent = entity.GetFirstComponentByType<CurrencyComponent>();

            if(currencyComponent != null)
            {
                currencyComponent.Gold += NumberOfCoins;
                NumberOfCoins = 0;
            }
        }
    }
}
