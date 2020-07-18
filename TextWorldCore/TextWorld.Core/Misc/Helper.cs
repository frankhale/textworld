using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;

namespace TextWorld.Core.Misc
{
    public static class Helper
    {
        public static Entity GetPlayersCurrentRoom(Entity playerEntity, List<Entity> roomEntities) 
        {
            Entity result = null;
            var roomIdComponent = playerEntity.GetFirstComponentByName<IdComponent>("current room");

            if(roomIdComponent != null)
            {
                result = roomEntities.FirstOrDefault(x => x.Id == roomIdComponent.Id);
            }

            return result;
        }
    }
}
