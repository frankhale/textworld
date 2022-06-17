using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class CommandComponent : TWComponent
    {
        public string Command { get; private set; }
        public string[] Args { get; private set; }

        public CommandComponent(string name, string command) : base(name)
        {
            Command = command;
            Args = Array.Empty<string>();
        }

        public CommandComponent(string name, string command, string[] args) : this(name, command)
        {
            Args = args;
        }
    }
}
