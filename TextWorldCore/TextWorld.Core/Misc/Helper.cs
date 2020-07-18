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

        public static void AddCommandComponentToEntity(Entity commandEntity, string command)
        {
            if (!string.IsNullOrEmpty(command))
            {
                var commandParts = command.ToLower().Split(" ");

                if (commandParts.Length > 1)
                {
                    commandEntity.AddComponent(new CommandComponent("command", commandParts[0],
                        commandParts.Skip(1).Take(commandParts.Length).ToArray()));
                }
                else
                {
                    commandEntity.AddComponent(new CommandComponent("command", command.ToLower()));
                }
            }
        }
    }
}
