using System;
using System.Collections.Generic;
using System.Text;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    class MOTDSystem : System
    {
        public override void Run(Entity input, Entity output)
        {
            var motdDescriptionComponent = input.GetFirstComponentByType<DescriptionComponent>();

            if (motdDescriptionComponent != null)
            {
                output.AddComponent(new OutputComponent("output", motdDescriptionComponent.Description));
            }
        }
    }
}
