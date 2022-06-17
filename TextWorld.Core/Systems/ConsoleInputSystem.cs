using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ConsoleInputSystem : TWSystem
    {
        public override void Run(TWEntity commandEntity)
        {
            Console.Write("> ");
            Helper.AddCommandComponentToEntity(commandEntity, Console.ReadLine() ?? "");
        }
    }
}
