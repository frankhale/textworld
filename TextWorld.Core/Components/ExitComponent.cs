using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Components
{
    public class ExitComponent : TWComponent
    {
        public Direction Direction { get; private set; }
        public Guid RoomId { get; private set; }
        public string? RoomName { get; private set; }
        public bool Hidden { get; private set; }

        public ExitComponent(string name, Direction direction, Guid roomId, bool hidden) : base(name)
        {
            Direction = direction;
            RoomId = roomId;
            Hidden = hidden;
        }

        public ExitComponent(string name, Direction direction, string roomName, bool hidden) : base(name)
        {
            Direction = direction;
            RoomName = roomName;
            Hidden = hidden;
        }
    }
}