using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Items
{
    public class CoinPurse : Item
    {
        public int NumberOfCoins { get; private set; }

        public CoinPurse(Guid id, string name, int numberOfCoins, string description, string[] synonyms)
            : base(id, name, description, ItemType.CoinPurse, synonyms, true)
        {
            NumberOfCoins = numberOfCoins;
            Consumable = true;
            IsContainer = true;
            CanBeDestroyed = true;            
        }

        public override void Use(TWEntity playerEntity, List<TWEntity> itemEntities, TWEntity outputEntity)
        {
            var currencyComponent = playerEntity.GetComponentByType<CurrencyComponent>();

            if (currencyComponent != null)
            {
                currencyComponent.Coins += NumberOfCoins;                

                outputEntity.AddComponent(new OutputComponent("output for item used", $"{Name} used: +{NumberOfCoins} coins", OutputType.Regular));
            }
        }
    }
}
