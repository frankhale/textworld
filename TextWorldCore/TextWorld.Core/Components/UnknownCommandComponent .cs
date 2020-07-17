namespace TextWorld.Core.Components
{
    public class UnknownCommandComponent : Component
    {
        public string Command { get; private set; }

        public UnknownCommandComponent(string name, string command) : base(name)
        {
            Command = command;
        }
    }
}
