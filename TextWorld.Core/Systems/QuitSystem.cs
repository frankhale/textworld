using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Systems
{
    public class QuitSystem : TWSystem
    {
        public override void Run(TWEntityCollection gameEntities, Action action)
        {
            var playerEntity = gameEntities.GetEntityByName("players", "player");

            var component = playerEntity!.GetComponentByType<QuitComponent>();

            if (component != null)
            {
                action();

                playerEntity.RemoveComponent(component);
            }
        }
    }
}
