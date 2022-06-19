using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Items
{
    public class CoinPurse : Item
    {
        public int NumberOfCoins { get; private set; }

        public CoinPurse(Guid id, string name, int numberOfCoins, int itemQuantity) : base(id, name, itemQuantity)
        {
            NumberOfCoins = numberOfCoins;
            Synonyms = new string[] { "purse", "coin purse", "coins" };
        }

        public override void Use(TWEntity entity)
        {
            var currencyComponent = entity.GetComponentByType<CurrencyComponent>();

            if (currencyComponent != null)
            {
                currencyComponent.Gold += NumberOfCoins;
                NumberOfCoins = 0;
            }
        }
    }
}
