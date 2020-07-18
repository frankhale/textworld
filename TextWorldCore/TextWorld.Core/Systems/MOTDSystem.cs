using System;
using System.Collections.Generic;
using System.Text;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    class MOTDSystem : System
    {
        public override void Run(Entity motdEntity, Entity outputEntity)
        {
            var motdDescriptionComponent = motdEntity.GetFirstComponentByType<DescriptionComponent>();

            if (motdDescriptionComponent != null)
            {
                outputEntity.AddComponent(new OutputComponent("output", motdDescriptionComponent.Description));
            }
        }
    }
}
