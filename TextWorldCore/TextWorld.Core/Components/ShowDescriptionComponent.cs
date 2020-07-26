using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class ShowDescriptionComponent : Component
    {
        public Entity Entity { get; private set; }

        public ShowDescriptionComponent(string name, Entity entity) : base(name) 
        {
            Entity = entity;
        }
    }
}
