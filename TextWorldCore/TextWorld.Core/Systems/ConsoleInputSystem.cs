using System;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    public class ConsoleInputSystem : System
    {
        public override void Run(Entity input)
        {
            Console.Write("> ");
            var command = Console.ReadLine() ?? "";

            if (!string.IsNullOrEmpty(command))
            {
                input.AddComponent(new CommandComponent("command", command.ToLower()));
            }
        }
    }
}
