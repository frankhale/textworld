using System;
using TextWorld.Core.Misc;
using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class ExitComponent : TWComponent
    {
        public Direction Direction { get; private set; }
        public Guid RoomId { get; private set; }

        public ExitComponent(string name, Direction direction, Guid roomId) : base(name)
        {
            Direction = direction;
            RoomId = roomId;
        }
    }
}