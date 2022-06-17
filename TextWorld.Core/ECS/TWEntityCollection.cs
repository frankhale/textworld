namespace TextWorld.Core.ECS
{
    public class TWEntityCollection
    {
        public List<TWEntity> Entities { get; private set; } = new List<TWEntity>();
        public string? Name { get; private set; }

        public TWEntityCollection(string name)
        {
            Name = name;
        }

        public void AddEntity(TWEntity entity)
        {
            Entities.Add(entity);
        }

        public void RemoveEntity(TWEntity entity)
        {
            Entities.Remove(entity);
        }

        public TWEntity? GetEntityByName(string name)
        {
            return Entities.FirstOrDefault(x => x.Name == name);
        }
    }
}
