using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class DisplayNameComponent : Component
    {
        public string DisplayName { get; private set; }

        public DisplayNameComponent(string name, string displayName) : base(name)
        {
            DisplayName = displayName;
        }
    }
}