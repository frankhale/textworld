using System;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ConsoleInputSystem : ECS.TWSystem
    {
        public override void Run(TWEntity commandEntity)
        {
            Console.Write("> ");            
            Helper.AddCommandComponentToEntity(commandEntity, Console.ReadLine() ?? "");            
        }
    }
}
