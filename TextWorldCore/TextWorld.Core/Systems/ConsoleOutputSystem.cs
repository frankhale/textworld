using System;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    class ConsoleOutputSystem : System
    {
        public override void Run(Entity input)
        {
            foreach (var component in input.GetComponentsByType<OutputComponent>())
            {
                Console.WriteLine(component.Value);
                Console.WriteLine();
            }

            input.Components.Clear();
        }
    }
}
