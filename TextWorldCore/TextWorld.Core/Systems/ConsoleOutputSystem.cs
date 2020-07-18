using System;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    public class ConsoleOutputSystem : System
    {
        public override void Run(Entity outputEntity)
        {
            foreach (var component in outputEntity.GetComponentsByType<OutputComponent>())
            {
                Console.WriteLine(component.Value);
                Console.WriteLine();
            }

            outputEntity.Components.Clear();
        }
    }
}
