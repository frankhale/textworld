using System.Collections.Generic;
using System.Linq;

namespace TextWorld.Core.ECS
{
    public class EntityCollection
    {
        public List<Entity> Entities { get; private set; } = new List<Entity>();
        public string Name { get; private set; }

        public EntityCollection(string name)
        {
            Name = name;
        }

        public void AddEntity(Entity entity)
        {
            Entities.Add(entity);
        }

        public void RemoveEntity(Entity entity)
        {
            Entities.Remove(entity);
        }

        public Entity GetEntityByName(string name)
        {
            return Entities.FirstOrDefault(x => x.Name == name);
        }
    }
}
