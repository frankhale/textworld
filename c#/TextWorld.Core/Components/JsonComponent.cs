using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class JsonComponent : TWComponent
    {
        public string Json { get; private set; }

        public JsonComponent(string name, Guid id, string json) : base(name, id)
        {
            Json = json;
        }
    }
}
