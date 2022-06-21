using Newtonsoft.Json;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Data
{
    public class Loader
    {
        private Game? Data;

        public bool Load(string path)
        {
            try
            {
                var json = File.ReadAllText(path);
                Data = JsonConvert.DeserializeObject<Game>(json);
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public TWEntity GetPlayerEntity()
        {
            TWEntity playerEntity = new("Player Entity");

            //playerEntity.AddComponent(new DescriptionComponent("player description", Data!.player!.description.ToString()));
            //playerEntity.AddComponent(new CurrencyComponent("coins", Data?.player?.currency!.coins));            
            //PlayerEntity.AddComponent(new InventoryComponent("player inventory"));
            //PlayerEntity.AddComponent(new HealthComponent("player health", 100, 100));
            //PlayerEntity.AddComponent(new IdComponent("player current room", openFieldId));

            return playerEntity;
        }
    }
}
