using System;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Systems
{
    public class QuitSystem : ECS.System
    {
        public override void Run(Entity playerEntity, Action action)
        {
            var component = playerEntity.GetComponentByType<QuitComponent>();

            if (component != null)
            {
                action();

                playerEntity.RemoveComponent(component);
            }
        }
    }
}
