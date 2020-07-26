using System;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ConsoleInputSystem : ECS.System
    {
        public override void Run(Entity commandEntity)
        {
            Console.Write("> ");            
            Helper.AddCommandComponentToEntity(commandEntity, Console.ReadLine() ?? "");            
        }
    }
}
