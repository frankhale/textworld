using System;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class IdComponent : TWComponent
    {
        public Guid Id { get; private set; }

        public IdComponent(string name, Guid id) : base(name)
        {
            Id = id;
        }

        public void SetId(Guid id)
        {
            Id = id;
        }
    }
}