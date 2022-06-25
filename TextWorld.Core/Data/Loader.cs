using Newtonsoft.Json;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Items;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Data
{
    // FIXME: We are taking short cuts in here and explicitly ignoring some possible null values
    //        in data. This is so freaking lame, I'm using bandaids and witchcraft to get this
    //        to work!!!
    public class GameLoader
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

        public GameEntities GetGameEntities()
        {
            GameEntities gameEntities = new();

            TWEntity playerEntity = new("Player Entity");
            List<TWEntity> roomEntities = new();
            List<TWEntity> itemEntities = new();

            if (Data != null && Data.Player != null && Data.Rooms != null && Data.Items != null)
            {
                Dictionary<string, Guid> roomIds = new() { };
                Dictionary<int, Guid> itemIds = new() { };

                #region ITEMS
                foreach (var item in Data.Items)
                {
                    itemIds[item.Id] = Guid.NewGuid();

                    TWEntity itemEntity = new(item.Name!);

                    var fullItem = Data.Items.FirstOrDefault(x => x.Id == item.Id);

                    if (fullItem != null)
                    {
                        var itemGuid = itemIds[item.Id];
                        dynamic? itemAttributes = JsonConvert.DeserializeObject(fullItem.AttributesJSON!);
                        
                        if (fullItem.ItemType == ItemType.CoinPurse)
                        {
                            var numberOfCoins = (int)itemAttributes!.NumberOfCoins;

                            itemEntity.AddComponent(new ItemComponent($"{fullItem.Name} item",
                                new CoinPurse(itemGuid, fullItem.Name!, (int)itemAttributes!.NumberOfCoins, fullItem.Description!, fullItem.Synonyms!)));
                        }
                        else if (fullItem.ItemType == ItemType.HealthPotion)
                        {
                            itemEntity.AddComponent(new ItemComponent($"{fullItem.Name} item",
                                new HealthPotion(itemGuid, fullItem.Name!, (int)itemAttributes!.Health, fullItem.Description!, fullItem.Synonyms!)));
                        }
                        else if (fullItem.ItemType == ItemType.Lamp)
                        {
                            itemEntity.AddComponent(new ItemComponent($"{fullItem.Name} item",
                                new Lamp(itemGuid, fullItem.Name!, fullItem.Description!, Array.Empty<string>())));
                        }
                    }

                    itemEntity.AddComponent(new JsonComponent(item.Name!, itemIds[item.Id!], JsonConvert.SerializeObject(item))); 
                    itemEntities.Add(itemEntity);
                }

                gameEntities.Items = itemEntities;
                #endregion

                #region ROOMS
                foreach (var room in Data.Rooms)
                {
                    if (!string.IsNullOrEmpty(room.Name))
                    {
                        roomIds[room.Name] = Guid.NewGuid();
                    }
                }

                foreach (var room in Data.Rooms)
                {
                    if (!string.IsNullOrEmpty(room.Name))
                    {
                        TWEntity roomEntity = new(roomIds[room.Name], room.Name);

                        roomEntity.AddComponent(new DisplayNameComponent($"{room.Name} display name", room.Name));

                        if (!string.IsNullOrEmpty(room.Description))
                            roomEntity.AddComponent(new DescriptionComponent($"{room.Name} display name", room.Description));

                        if (room.Exits != null)
                        {
                            foreach (var exit in room.Exits)
                            {
                                roomEntity.AddComponent(new ExitComponent($"{exit.Direction} exit", exit.Direction, roomIds[exit.RoomId!], exit.Hidden));
                            }
                        }

                        // add new item component to roomEntity
                        if (room.Items != null && Data.Items != null)
                        {
                            foreach (var item in room.Items)
                            {
                                var fullItem = Data.Items.FirstOrDefault(x => x.Id == item.Id);

                                roomEntity.AddComponent(new ItemDropComponent($"item drop component", new InventoryItem { 
                                    Id = itemIds[item.Id],
                                    Name = fullItem!.Name!,
                                    Quantity = item.Quantity
                                }));
                            }
                        }

                        roomEntities.Add(roomEntity);
                    }
                }

                gameEntities.Rooms = roomEntities;
                #endregion

                #region PLAYER
                if (!string.IsNullOrEmpty(Data.Player.Description)) playerEntity.AddComponent(new DescriptionComponent("player description", Data.Player.Description));
                if (Data.Player.Currency != null) playerEntity.AddComponent(new CurrencyComponent("coins", Data.Player.Currency.Coins));
                if (!string.IsNullOrEmpty(Data.Player.CurrentRoom)) playerEntity.AddComponent(new IdComponent("player current room", roomIds[Data.Player.CurrentRoom], IdType.Room));
                if (Data.Player.Health != null) playerEntity.AddComponent(new HealthComponent("player health", Data.Player.Health.CurrentHealth, Data.Player.Health.MaxHealth));

                var inventoryComponent = new InventoryComponent("player inventory");
                playerEntity.AddComponent(inventoryComponent);

                if (Data.Player.Inventory != null)
                {
                    foreach (var item in Data.Player.Inventory)
                    {
                        var fullItem = Data.Items.FirstOrDefault(x => x.Id == item.Id);

                        if (fullItem != null)
                        {
                            inventoryComponent.AddItem(new()
                            {
                                Id = itemIds[item.Id],
                                Name = fullItem.Name,
                                Quantity = item.Quantity,
                            });
                        }
                    }
                }

                gameEntities.Player = playerEntity;
                #endregion

                if (!string.IsNullOrEmpty(Data.MOTD))
                {
                    gameEntities.MOTD = new TWEntity("MOTD Entity");
                    gameEntities.MOTD.AddComponent(new DescriptionComponent("motd description", "Welcome to a text adventure written using an entity component system based engine called TextWorld. Look around, have fun!"));
                }
            }

            return gameEntities;
        }
    }
}
