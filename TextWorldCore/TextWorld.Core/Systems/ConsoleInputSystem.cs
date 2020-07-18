using System;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    public class ConsoleInputSystem : System
    {
        public override void Run(Entity commandEntity)
        {
            Console.Write("> ");
            var command = Console.ReadLine() ?? "";

            if (!string.IsNullOrEmpty(command))
            {
                commandEntity.AddComponent(new CommandComponent("command", command.ToLower()));
            }
        }
    }
}
