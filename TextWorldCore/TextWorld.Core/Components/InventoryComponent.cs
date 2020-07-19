using System;
using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Components
{
    public class InventoryComponent : Component
    {
        public List<InventoryItem> Items { get; private set; } = new List<InventoryItem>();

        public InventoryComponent(string name) : base(name) { }

        public void AddItem(InventoryItem i)
        {
            if(i.Id != Guid.Empty)
            {
                Items.Add(i);
            }
        }

        public void IncrementItemCount(Guid id, int count)
        {
            var item = Items.FirstOrDefault(x => x.Id == id);

            if (item != null)
            {
                item.Quantity += count;
            }
        }

        public void DecrementItemCount(Guid id, int count)
        {
            var item = Items.FirstOrDefault(x => x.Id == id);

            if (item != null)
            {
                item.Quantity -= count;
            }
        }
    }
}
