using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class CommandComponent : TWComponent
    {
        public string Command { get; private set; }
        public string[] Args { get; private set; }
        public string CommandWithArgs
        {
            get
            {
                return $"{Command} {string.Join(" ", Args)}";
            }
        }
        public string ArgsOnly { get; private set; }

        public CommandComponent(string name, string command) : base(name)
        {
            var commandParts = command.ToLower().Split(" ");

            Command = commandParts[0];

            if (commandParts.Length > 1)
            {                
                Args = commandParts.Skip(1).Select(x => x.Trim()).Take(commandParts.Length).ToArray();
                ArgsOnly = string.Join(" ", Args);
            }
            else
            {
                Args = Array.Empty<string>();
                ArgsOnly = string.Empty;
            }
        }

        public CommandComponent(string name, string command, string[] args) : this(name, command)
        {
            Args = args;
        }
    }
}
