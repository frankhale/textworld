using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Systems
{
    public class QuitSystem : TWSystem
    {
        public override void Run(TWEntity playerEntity, Action action)
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
