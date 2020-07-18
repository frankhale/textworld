using System;
using System.Linq;
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
                var commandParts = command.ToLower().Split(" ");

                if (commandParts.Length > 1)
                {
                    commandEntity.AddComponent(new CommandComponent("command", commandParts[0],
                        commandParts.Skip(1).Take(commandParts.Length).ToArray()));
                }
                else
                {
                    commandEntity.AddComponent(new CommandComponent("command", command.ToLower()));
                }
            }
        }
    }
}
