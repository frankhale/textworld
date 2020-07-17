namespace TextWorld.Core.Components
{
    public class CommandComponent : Component
    {
        public string Command { get; private set; }

        public CommandComponent(string name, string command) : base(name)
        {
            Command = command;
        }
    }
}
