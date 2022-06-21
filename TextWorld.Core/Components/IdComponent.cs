using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class IdComponent : TWComponent
    {
        public IdComponent(string name, Guid id) : base(name, id) { }
    }
}