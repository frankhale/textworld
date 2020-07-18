using System;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ConsoleInputSystem : System
    {
        public override void Run(Entity commandEntity)
        {
            Console.Write("> ");            
            Helper.AddCommandComponentToEntity(commandEntity, Console.ReadLine() ?? "");            
        }
    }
}
