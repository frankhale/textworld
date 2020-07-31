using System;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Systems
{
    public class ConsoleOutputSystem : ECS.TWSystem
    {
        public override void Run(TWEntity outputEntity)
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
