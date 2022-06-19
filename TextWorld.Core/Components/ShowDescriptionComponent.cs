using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Components
{
    public class ShowDescriptionComponent : TWComponent
    {
        public TWEntity? Entity { get; private set; }
        public List<TWEntity>? Entities { get; private set; }
        public DescriptionType DescriptionType { get; private set; }

        public ShowDescriptionComponent(string name, TWEntity entity, DescriptionType descriptionType) : base(name)
        {
            Entity = entity;
            DescriptionType = descriptionType;
        }

        public ShowDescriptionComponent(string name, List<TWEntity>? entities, DescriptionType descriptionType) : base(name)
        {            
            Entities = entities;
            DescriptionType = descriptionType;
        }
    }
}
