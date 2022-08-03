using TextWorld.Core.Data;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class IdComponent : TWComponent
    {
        public IdType IdType { get; set; }

        public IdComponent(string name, Guid id, IdType idType) : base(name, id) { }
    }
}