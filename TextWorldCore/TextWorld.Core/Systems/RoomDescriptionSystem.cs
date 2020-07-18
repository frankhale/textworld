﻿using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    public class RoomDescriptionSystem : System
    {
        public override void Run(Entity playerEntity, List<Entity> roomEntities, Entity outputEntity)
        {
            var processedComponents = new List<Component>();

            foreach (var component in playerEntity.Components
                .Where(x => x.GetType() == typeof(ShowDescriptionComponent)))
            {
                processedComponents.Add(component);

                var entity = (component as ShowDescriptionComponent).Entity;

                if (entity != null)
                {
                    var descriptionComponent = entity.GetFirstComponentByType<DescriptionComponent>();

                    if (descriptionComponent != null)
                    {
                        outputEntity.AddComponent(new OutputComponent("output", descriptionComponent.Description));
                    }
                }
            }

            //if (processedComponents.Count() > 0)
            //{                
            //DescriptionComponent descriptionComponent;
            //var currentRoomComponent = playerEntity.GetFirstComponentByName<IdComponent>("current room");
            //if (currentRoomComponent != null)
            //{
            //    var currentRoomEntity = roomEntities.FirstOrDefault(x => x.Id == currentRoomComponent.Id);

            //    if (currentRoomEntity != null)
            //    {
            //        descriptionComponent = currentRoomEntity.GetFirstComponentByName<DescriptionComponent>("description");
            //        if (descriptionComponent != null)
            //        {
            //            outputEntity.AddComponent(new OutputComponent("output", descriptionComponent.Description));
            //        }
            //    }
            //}
            //}

            playerEntity.RemoveComponents(processedComponents);
        }
    }
}
