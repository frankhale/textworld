namespace TextWorld.Core.ECS
{
    public abstract class TWSystem
    {
        // FIXME: ??? Can we anticipate all combinations of inputs? Geesus!
        public virtual void Run(TWEntity input) { }
        public virtual void Run(TWEntity input, Action action) { }
        public virtual void Run(TWEntity input, TWEntity output) { }
        public virtual void Run(TWEntity input1, TWEntity input2, TWEntity output) { }
        public virtual void Run(TWEntity input1, List<TWEntity> input2, TWEntity output) { }
        public virtual void Run(TWEntity input1, TWEntity input2, List<TWEntity> input3, TWEntity output) { }
    }
}
