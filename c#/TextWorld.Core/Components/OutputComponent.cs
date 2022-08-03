using TextWorld.Core.ECS;
using TextWorld.Core.Data;

namespace TextWorld.Core.Components
{
    public class OutputComponent : TWComponent
    {
        public string Value { get; private set; }
        public OutputType OutputType { get; private set; }

        public OutputComponent(string name, string value, OutputType outputType) : base(name)
        {
            Value = value;
            OutputType = outputType;
        }
    }
}
