using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class ShowDescriptionComponent : TWComponent
    {
        public TWEntity Entity { get; private set; }

        public ShowDescriptionComponent(string name, TWEntity entity) : base(name) 
        {
            Entity = entity;
        }
    }
}
