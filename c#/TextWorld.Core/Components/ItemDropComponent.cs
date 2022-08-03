﻿using TextWorld.Core.ECS;
using TextWorld.Core.Data;

namespace TextWorld.Core.Components
{
    public class ItemDropComponent : TWComponent
    {
        public InventoryItem Item { get; private set; }

        public ItemDropComponent(string name, InventoryItem item) : base(name)
        {
            Item = item;
        }
    }
}