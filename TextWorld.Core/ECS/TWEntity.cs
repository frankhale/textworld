namespace TextWorld.Core.ECS
{
    public class TWEntity
    {
        public Guid Id { get; } = Guid.NewGuid();
        public string Name { get; private set; }
        public List<TWComponent> Components { get; private set; } = new();
        
        public TWEntity(string name)
        {
            Name = name;
        }

        public TWEntity(Guid id, string name) : this(name)
        {
            Id = id;
        }

        public TWEntity(Guid id, string name, List<TWComponent> components) : this(id, name)
        {
            Components = components;
        }

        public void AddComponent<T>(T component) where T : TWComponent
        {
            Components.Add(component);
        }

        public void RemoveComponent<T>(T component) where T : TWComponent
        {
            Components.Remove(component);
        }

        public void RemoveComponents(IEnumerable<TWComponent> components)
        {
            foreach (var c in components)
            {
                Components.Remove(c);
            }
        }

        public void RemoveComponentByName(Type componentType, string name)
        {
            Components.RemoveAll(x => x.GetType() == componentType && x.Name == name);
        }

        public void RemoveComponentsByType<T>()
        {
            var components = Components.Where(x => x.GetType() == typeof(T)).ToList();

            foreach (var component in components)
            {
                Components.Remove(component);
            }
        }

        public List<T> GetComponentsByType<T>() where T : TWComponent
        {
            return Components.Where(x => x.GetType() == typeof(T)).Cast<T>().ToList();
        }

        public T? GetComponentByName<T>(string name) where T : TWComponent
        {
            return Components.FirstOrDefault(x => x.GetType() == typeof(T) && x.Name == name) as T;
        }

        public T? GetComponentByType<T>() where T : TWComponent
        {
            return Components.FirstOrDefault(x => x.GetType() == typeof(T)) as T;
        }
    }
}