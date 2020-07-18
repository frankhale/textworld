using System;
using System.Collections.Generic;
using System.Text;
using TextWorld.Core.Components;

namespace TextWorld.Core.Systems
{
    public class QuitSystem : System
    {
        public override void Run(Entity input, Action action)
        {
            var component = input.GetFirstComponentByType<QuitComponent>();

            if (component != null)
            {
                action();

                input.RemoveComponent(component);
            }
        }
    }
}
