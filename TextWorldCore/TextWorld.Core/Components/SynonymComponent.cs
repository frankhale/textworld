using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class SynonymComponent : Component
    {
        public string[] Synonyms { get; private set; }

        public SynonymComponent(string name, string[] synonyms) : base(name)
        {
            Synonyms = synonyms;
        }
    }
}
