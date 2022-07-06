﻿using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class RoomDescriptionSystem : TWSystem
    {
        public override void Run(TWEntityCollection gameEntities)
        {
            var playerEntity = gameEntities.GetEntityByName("players", "player");
            var outputEntity = gameEntities.GetEntityByName("misc", "output");
            var roomEntities = gameEntities["rooms"];

            var processedComponents = new List<TWComponent>();

            if (playerEntity != null && roomEntities != null && outputEntity != null)
            {

                foreach (ShowDescriptionComponent showDescriptionComponent in playerEntity!.Components
                    .Where(x => x.GetType() == typeof(ShowDescriptionComponent)))
                {
                    processedComponents.Add(showDescriptionComponent);

                    if (showDescriptionComponent!.DescriptionType == DescriptionType.Room)
                    {
                        var entity = showDescriptionComponent!.Entity;
                        var descriptionComponent = entity!.GetComponentByType<DescriptionComponent>();
                        outputEntity!.AddComponent(new OutputComponent("room description output", descriptionComponent!.Description, OutputType.Regular));
                    }
                    else if (showDescriptionComponent!.DescriptionType == DescriptionType.Exit)
                    {
                        outputEntity!.AddComponent(new OutputComponent("exit description output", showDescriptionComponent!.Name, OutputType.Regular));
                    }
                }

                playerEntity.RemoveComponents(processedComponents);
            }
        }
    }
}
