using System;
using System.Collections.Generic;
using System.Linq;

namespace TextWorld.Core.ECS
{
    public class Entity
    {
        public Guid Id { get; } = Guid.NewGuid();
        public string Name { get; private set; }
        public List<Component> Components { get; private set; } = new List<Component>();

        public Entity(string name)
        {
            Name = name;
        }

        public Entity(Guid id, string name) : this(name)
        {
            Id = id;
        }

        public Entity(Guid id, string name, List<Component> components) : this(id, name)
        {                    
            Components = components;
        }

        public void AddComponent<T>(T component) where T : Component
        {
            Components.Add(component);
        }

        public void RemoveComponent<T>(T component) where T : Component
        {
            Components.Remove(component);
        }

        public void RemoveComponents(IEnumerable<Component> components)
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

        public List<T> GetComponentsByType<T>() where T: Component
        {
            return Components.Where(x => x.GetType() == typeof(T)).Cast<T>().ToList();
        }

        public T GetComponentByName<T>(string name) where T: Component
        {
            return Components.FirstOrDefault(x => x.GetType() == typeof(T) && x.Name == name) as T;
        }

        public T GetComponentByType<T>() where T: Component
        {
            return Components.FirstOrDefault(x => x.GetType() == typeof(T)) as T;
        }
    }
}