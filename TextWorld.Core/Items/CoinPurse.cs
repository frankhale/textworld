using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Items
{
    public class CoinPurse : Item
    {
        public int NumberOfCoins { get; private set; }

        public CoinPurse(Guid id, string name, int numberOfCoins, int itemQuantity, string description, string[] synonyms)
            : base(id, name, itemQuantity, description, ItemType.CoinPurse, synonyms, true)
        {
            NumberOfCoins = numberOfCoins;            
        }

        public override void Use(TWEntity entity)
        {
            var currencyComponent = entity.GetComponentByType<CurrencyComponent>();

            if (currencyComponent != null)
            {
                currencyComponent.Coins += NumberOfCoins;
                NumberOfCoins = 0;
            }
        }
    }
}
