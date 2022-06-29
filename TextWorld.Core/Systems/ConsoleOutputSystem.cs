using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Systems
{
    public class ConsoleOutputSystem : TWSystem
    {
        public override void Run(TWEntityCollection gameEntities)
        {            
            var outputEntity = gameEntities.GetEntityByName("misc", "output");

            foreach (var component in outputEntity!.GetComponentsByType<OutputComponent>())
            {                
                if (component.OutputType == OutputType.Regular)
                {
                    Console.WriteLine(component.Value);
                    Console.WriteLine();
                }
                //else if (component.OutputType == OutputType.Command)
                //{
                //    Console.WriteLine($"command: {component.Value}");
                //    Console.WriteLine();
                //}
                else if (component.OutputType == OutputType.Separator)
                {
                    Console.WriteLine();
                }
                else if (component.OutputType == OutputType.MessageOfTheDay)
                {
                    Console.WriteLine($"-[ {component.Value} ]-");
                    Console.WriteLine();
                }
            }

            outputEntity.Components.Clear();
        }
    }
}
