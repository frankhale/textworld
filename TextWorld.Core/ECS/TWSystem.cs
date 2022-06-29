namespace TextWorld.Core.ECS
{
    public abstract class TWSystem
    {
        public virtual void Run(TWEntityCollection entities) { }
        public virtual void Run(TWEntityCollection gameEntities, Action action) { }
        //public virtual void Run(TWEntity input) { }
        //public virtual void Run(TWEntity entity1, TWEntity entity2) { }
        //public virtual void Run(TWEntity input, Action action) { }        
        //public virtual void Run(TWEntity input1, TWEntity input2, TWEntity output) { }
        //public virtual void Run(TWEntity input1, List<TWEntity> input2, TWEntity output) { }
        //public virtual void Run(TWEntity input1, List<TWEntity> input2, List<TWEntity> input3, TWEntity output) { }
        //public virtual void Run(TWEntity input1, TWEntity input2, List<TWEntity> input3, TWEntity output) { }
        //public virtual void Run(TWEntity input1, TWEntity input2, List<TWEntity> input3, List<TWEntity> input4, TWEntity output) { }
    }
}
