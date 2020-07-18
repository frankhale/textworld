using System;
using System.Collections.Generic;

namespace TextWorld.Core
{
    public abstract class System
    {
        // FIXME: ??? Can we anticipate all combinations of inputs? Geesus!
        public virtual void Run(Entity input) { }
        public virtual void Run(Entity input, Action action) { }
        public virtual void Run(Entity input, Entity output) { }
        public virtual void Run(Entity input1, Entity input2, Entity output) { }
        public virtual void Run(Entity input1, List<Entity> input2, Entity output) { }
        public virtual void Run(Entity input1, Entity input2, List<Entity> input3, Entity output) { }
    }
}
