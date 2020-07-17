using System;
using System.Collections.Generic;
using TextWorld.Core.Components;

namespace TextWorld.Core.Misc
{
    public class Entity
    {
        public System.Guid Id { get; } = Guid.NewGuid();
        public string Name { get; private set; }
        public List<Component> Components { get; private set; } = new List<Component>();

        public Entity(string name)
        {
            Name = name;
        }

        public void AddComponent<T>(T component) where T : Component
        {
            Components.Add(component);
        }

        public void RemoveComponent<T>(T component) where T : Component
        {
            Components.Remove(component);
        }
    }

}