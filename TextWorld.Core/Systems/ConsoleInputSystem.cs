using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ConsoleInputSystem : TWSystem
    {
        public override void Run(TWEntity playerEntity, TWEntity commandEntity, TWEntity outputEntity)
        {
            var healthComponent = playerEntity.GetComponentByType<HealthComponent>();

            if (healthComponent != null)
            {
                Console.Write($"[health:{healthComponent.CurrentHealth}/{healthComponent.MaxHealth}]> ");
            }
            else
            {
                Console.Write("> ");
            }

            var command = Console.ReadLine();
            outputEntity.AddComponent(new OutputComponent("command output", command!, OutputType.Command));
            Helper.AddCommandComponentToEntity(commandEntity, command!);
        }
    }
}
