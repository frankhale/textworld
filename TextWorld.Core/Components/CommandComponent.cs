using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class CommandComponent : TWComponent
    {
        public string Command { get; private set; }
        public string FullCommand
        {
            get
            {
                return string.Join(" ", Args);
            }
        }
        public string[] Args { get; private set; }
        public string ArgsJoined
        {
            get
            {
                return string.Join(" ", Args);
            }
        }

        public CommandComponent(string name, string command) : base(name)
        {
            var commandParts = command.ToLower().Split(" ");

            Command = commandParts[0];

            if (commandParts.Length > 1)
            {
                Args = commandParts.Skip(1).Take(commandParts.Length).ToArray();
            }
            else
            {
                Args = Array.Empty<string>();
            }
        }

        public CommandComponent(string name, string command, string[] args) : this(name, command)
        {
            Args = args;
        }
    }
}
