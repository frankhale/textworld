using System;
using System.Collections.Generic;
using System.Text;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    public class QuitSystem : System
    {
        public override void Run(Entity playerEntity, Action action)
        {
            var component = playerEntity.GetFirstComponentByType<QuitComponent>();

            if (component != null)
            {
                action();

                playerEntity.RemoveComponent(component);
            }
        }
    }
}
