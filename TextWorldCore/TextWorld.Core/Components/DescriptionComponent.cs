using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class DescriptionComponent : Component
    {
        public string Description { get; private set; }

        public DescriptionComponent(string name, string description) : base(name)
        {
            Description = description;
        }
    }
}
