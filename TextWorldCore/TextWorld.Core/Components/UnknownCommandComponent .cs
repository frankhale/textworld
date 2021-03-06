﻿using TextWorld.Core.ECS;

namespace TextWorld.Core.Components
{
    public class UnknownCommandComponent : TWComponent
    {
        public string Command { get; private set; }

        public UnknownCommandComponent(string name, string command) : base(name)
        {
            Command = command;
        }
    }
}
