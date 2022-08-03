using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Data;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ConsoleInputSystem : TWSystem
    {
        public override void Run(TWEntityCollection gameEntities)
        {
            var playerEntity = gameEntities.GetEntityByName("players", "player");
            var commandEntity = gameEntities.GetEntityByName("misc", "command");
            var outputEntity = gameEntities.GetEntityByName("misc", "output");

            var statsComponent = playerEntity!.GetComponentByType<StatsComponent>();
            var currencyComponent = playerEntity!.GetComponentByType<CurrencyComponent>();

            if (statsComponent != null && currencyComponent != null)
            {
                Console.Write($"[Stats:{statsComponent.Health.CurrentValue}/{statsComponent.Magicka.CurrentValue}/{statsComponent.Stamina.CurrentValue}|G{currencyComponent.Coins}]> ");
            }
            else
            {
                Console.Write("> ");
            }

            var command = Console.ReadLine();
            outputEntity!.AddComponent(new OutputComponent("command output", command!, OutputType.Command));
            Helper.AddCommandComponentToEntity(commandEntity!, command!);
        }
    }
}
