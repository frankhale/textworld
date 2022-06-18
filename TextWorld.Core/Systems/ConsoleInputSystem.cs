using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ConsoleInputSystem : TWSystem
    {
        public override void Run(TWEntity commandEntity, TWEntity outputEntity)
        {
            Console.Write("> ");
            var command = Console.ReadLine();
            outputEntity.AddComponent(new OutputComponent("command output", command!, OutputType.Command));
            Helper.AddCommandComponentToEntity(commandEntity, command!);
        }
    }
}
