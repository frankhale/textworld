namespace TextWorld.Core.ECS
{
    public class TWEntityCollection
    {
        private readonly Dictionary<string, List<TWEntity>> Entities = new();

        public void AddEntity(string name, TWEntity entity)
        {
            if (!Entities.ContainsKey(name))
            {
                Entities[name] = new List<TWEntity>();
            }

            Entities[name].Add(entity);            
        }

        public void AddEntities(string name, List<TWEntity> entities)
        {
            if (!Entities.ContainsKey(name))
            {
                Entities[name] = new List<TWEntity>();
            }

            Entities[name].AddRange(entities);
        }

        public void RemoveEntity(string name, TWEntity entity)
        {
            if (Entities[name] != null)
            {
                Entities[name].Remove(entity);
            }
        }

        public void RemoveEntities(string name)
        {
            if (Entities.ContainsKey(name))
            {                
                Entities.Remove(name);
            }
        }

        public TWEntity? GetEntityByName(string collectionName, string entityName)
        {
            if (Entities.ContainsKey(collectionName))
            {
                return Entities[collectionName].FirstOrDefault(x => x.Name == entityName);
            }

            return null;
        }

        public List<TWEntity>? GetEntitiesByName(string name)
        {
            if (Entities.ContainsKey(name))
            {
                return Entities[name];
            }

            return null;
        }
    }
}
