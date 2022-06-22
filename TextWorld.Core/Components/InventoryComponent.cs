using TextWorld.Core.ECS;
using TextWorld.Core.Misc;

namespace TextWorld.Core.Components
{
    public class InventoryComponent : TWComponent
    {
        public List<InventoryItem> Items { get; private set; } = new();

        public InventoryComponent(string name) : base(name) { }

        public void AddItem(InventoryItem i)
        {
            if (i.Id != Guid.Empty)
            {
                Items.Add(i);
            }
        }

        public void RemoveItem(InventoryItem item)
        {
            Items.Remove(item);
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

        public string GetItemsAsString()
        {
            var items = new List<string>();

            foreach (var item in Items)
            {
                items.Add($"{item.Name} ({item.Quantity})" ?? "No Name");
            }

            return string.Join(", ", items.ToArray());
        }
    }
}
