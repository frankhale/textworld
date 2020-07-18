using System;

namespace TextWorld.Core
{
    public abstract class System
    {
        // FIXME: We cannot possibly anticipate all the inputs and outputs, we need something better here!
        public virtual void Run(Entity input, Entity output) { }
        //public virtual void Run(Entity input1, Entity input2, Entity output) { }
        //public virtual void Run(Entity input1, Entity input2, Entity input3, Entity output) { }
        public virtual void Run(Entity input) { }
        public virtual void Run(Entity input, Action action) { }
    }
}
