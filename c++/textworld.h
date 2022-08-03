#pragma once

// cmake.EXE --build c:/Users/frank/Documents/DEV/game-dev/TextWorld++/out/build/x64-debug

#define SOL_ALL_SAFETIES_ON 1

#include <ranges>
#include <map>
#include <numeric>

#include <fmt/core.h>
#include <fmt/ranges.h>
#include <magic_enum.hpp>
#include <sol/sol.hpp>

#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>

#define to_lower(s) transform(s.begin(), s.end(), s.begin(), ::tolower);
#define to_upper(s) transform(s.begin(), s.end(), s.begin(), ::toupper);

extern std::string generate_uuid();

#define begin_room_configuration() { \
	std::unordered_map<std::string, textworld::data::RoomInfo> room_info{};

#define mk_rm(n, d) { \
	auto id = generate_uuid(); \
	auto room_entity = std::make_shared<textworld::ecs::Entity>(id, n); \
	auto room_description = std::make_shared<textworld::components::DescriptionComponent>(n, d); \
	room_entity->add_component(room_description); \
  room_info[n] = { .id = id, .name = n, .description = d, .entity = room_entity }; }

#define mk_ex(from_name, to_name, dir) { \
	auto from_room_info = room_info[from_name]; \
	auto to_room_info = room_info[to_name]; \
	auto from_exit_component = std::make_shared<textworld::components::ExitComponent>(from_name, dir, to_room_info.id); \
	auto to_exit_component = std::make_shared<textworld::components::ExitComponent>(to_room_info.name, textworld::core::get_opposite_direction(dir), from_room_info.id); \
	from_room_info.entity->add_component(from_exit_component); \
	to_room_info.entity->add_component(to_exit_component); \
  from_exit_component->set_room_name(to_name); \
	to_exit_component->set_room_name(from_name); }

#define pl_it(room_name, item_name, quantity) { \
	auto r_info = room_info[room_name]; \
	auto item_entity = entity_manager->get_entity_by_name("items", item_name); \
	auto item_component = item_entity->find_first_component_by_type<textworld::components::ItemComponent>(); \
	auto item = item_component->get_item(); \
	auto item_drop_component = std::make_shared<textworld::components::ItemDropComponent>(item_name, item->id, item_name, quantity); \
	r_info.entity->add_component(item_drop_component); }

#define mk_it(n, d, a) { \
		auto acts = std::unordered_map<std::string, textworld::core::simple_action_func>{ { "default", a } }; \
		auto i = textworld::helpers::make_consumable_item(n, d, acts); \
		auto item_entity = std::make_shared<textworld::ecs::Entity>(i->id, n); \
		auto item_component = std::make_shared<textworld::components::ItemComponent>(n, i); \
		item_entity->add_component(item_component); \
		entity_manager->add_entity_to_group(item_entity, "items"); }

#define end_room_configuration() \
	for (const auto& r : room_info) { entity_manager->add_entity_to_group(r.second.entity, "rooms"); } }

namespace textworld::ecs
{
	class Component
	{
	public:
		virtual ~Component() {};

		auto get_name() const { return component_name; }
		void set_name(std::string name) { component_name = name; }
		auto get_id() const { return id; }

		// protected:
		Component(std::string name, std::string id = generate_uuid()) : component_name(name)
		{
			this->id = id;
		}

	private:
		std::string component_name{};

	protected:
		std::string id{};
	};

	class Entity
	{
	public:
		Entity(std::string name) : Entity(generate_uuid(), name) {}
		Entity(std::string id, std::string name)
		{
			this->id = id;
			this->name = name;
			components = std::make_unique<std::vector<std::shared_ptr<Component>>>();
		}

		template <typename T>
		std::shared_ptr<T> find_first_component_by_type()
		{
			for (auto& c : *components)
			{
				auto casted = std::dynamic_pointer_cast<T>(c);

				if (casted != nullptr)
				{
					return casted;
				}
			}

			return nullptr;
		}

		template <typename T>
		auto find_component_by_type()
		{
			std::vector<std::shared_ptr<T>> matches{};

			for (auto& c : *components)
			{
				auto casted = std::dynamic_pointer_cast<T>(c);

				if (casted != nullptr)
				{
					matches.push_back(casted);
				}
			}

			return matches;
		}

		template <typename T>
		auto find_component_by_type(std::function<bool(std::shared_ptr<T>)> predicate)
		{
			std::vector<std::shared_ptr<T>> matches{};

			for (auto& c : *components)
			{
				auto casted = std::dynamic_pointer_cast<T>(c);

				if (casted != nullptr && predicate(casted))
				{
					matches.push_back(casted);
				}
			}

			return matches;
		}

		std::string get_name() { return name; }
		auto get_id() const { return id; }
		void add_component(std::shared_ptr<Component> c) { components->emplace_back(c); }
		void add_components(std::shared_ptr<std::vector<std::shared_ptr<Component>>> c) { components->insert(components->end(), c->begin(), c->end()); }

		template <typename T>
		void remove_components(std::vector<std::shared_ptr<T>> c)
		{
			for (auto& component : c)
			{
				auto it = std::find(components->begin(), components->end(), component);
				if (it != components->end())
				{
					components->erase(it);
				}
			}
		}

		void remove_component(std::shared_ptr<Component> component)
		{
			auto it = std::find(components->begin(), components->end(), component);
			if (it != components->end())
			{
				components->erase(it);
			}
		}

		void for_each_component(std::function<void(std::shared_ptr<Component>&)> fc)
		{
			for (auto& c : *components)
				fc(c);
		}

		void clear_components() { components->clear(); }

	private:
		std::string id;

	protected:
		std::string name;
		std::unique_ptr<std::vector<std::shared_ptr<Component>>> components{};
	};

	struct EntityGroup
	{
		std::string name{};
		std::shared_ptr<std::vector<std::shared_ptr<Entity>>> entities{};
	};

	class EntityManager
	{
	public:
		EntityManager()
		{
			entity_groups = std::make_unique<std::vector<std::shared_ptr<EntityGroup>>>();
		}

		void add_entity_to_group(std::shared_ptr<Entity> e, std::string group_name);
		std::shared_ptr<EntityGroup> create_entity_group(std::string name);
		std::shared_ptr<Entity> create_entity_in_group(std::string group_name, std::string entity_name);
		bool remove_entity(std::string entity_group_name, std::string entity_id);

		std::vector<std::string> get_entity_group_names()
		{
			std::vector<std::string> results{};
			for (auto& eg : *entity_groups)
			{
				results.push_back(eg->name);
			}
			return results;
		}
		std::shared_ptr<EntityGroup> get_entity_group(std::string name);
		std::shared_ptr<std::vector<std::shared_ptr<Entity>>> get_entities_in_group(std::string name);
		std::shared_ptr<Entity> get_entity_by_name(std::string entity_group, std::string entity_name);
		std::shared_ptr<Entity> get_entity_by_id(std::string entity_group, std::string entity_id);

		template <typename T>
		auto find_entities_by_component_type(std::string entity_group, std::function<bool(std::shared_ptr<T>)> predicate)
		{
			auto group = get_entity_group(entity_group);

			std::vector<std::shared_ptr<Entity>> matches{};
			for (auto& e : *group->entities)
			{
				auto result = e->find_component_by_type<T>(predicate);
				if (result.size() > 0)
				{
					matches.push_back(e);
				}
			}

			return matches;
		}

		std::shared_ptr<std::vector<std::shared_ptr<Entity>>> find_entities_in_group(std::string entity_group, std::function<bool(std::shared_ptr<Entity>)> predicate);

		std::shared_ptr<Entity> find_entity(std::string entity_group, std::function<bool(std::shared_ptr<Entity>)> predicate);

	private:
		std::unique_ptr<std::vector<std::shared_ptr<EntityGroup>>> entity_groups{};
	};
}

namespace textworld::core
{
	typedef std::function<void(std::shared_ptr<textworld::ecs::Entity>, std::string, std::vector<std::string>, std::shared_ptr<textworld::ecs::EntityManager>)> action_func;
	typedef std::function<void(std::shared_ptr<textworld::ecs::Entity>, std::shared_ptr<textworld::ecs::EntityManager>)> simple_action_func;

	extern std::unordered_map<std::string, simple_action_func> command_to_actions;
}

namespace textworld::data
{
	enum class Direction
	{
		NORTH,
		NORTHEAST,
		NORTHWEST,
		SOUTH,
		SOUTHEAST,
		SOUTHWEST,
		EAST,
		WEST,
		UP,
		DOWN
	};

	enum class DescriptionType
	{
		ROOM,
		EXIT,
		ITEM,
		SELF
	};

	enum class OutputType
	{
		MESSAGEOFTHEDAY,
		REGULAR,
		COMMAND,
		SEPARATOR
	};

	enum class ItemActionType
	{
		SHOW,
		SHOWALL,
		TAKE,
		TAKEALL,
		DROP,
		DROPALL,
		USE
	};

	enum class IdType
	{
		ROOM,
		ITEM,
		PLAYER,
		ZONE
	};

	struct Stat
	{
		int current_value{};
		int max_value{};
	};

	struct Item
	{
		std::string id{};
		std::string name{};
		std::string description{};
		std::vector<std::string> synonyms{};
		int quantity{};
		bool is_container{};
		bool can_be_destroyed{};
		bool consumable{};
		std::unordered_map<std::string, std::string> lua_scripted_actions{};
		std::unordered_map<std::string, textworld::core::simple_action_func> actions{};
	};

	struct ItemPickup
	{
		std::string id{};
		std::string name{};
		int quantity{};
	};

	struct RoomInfo
	{
		std::string id{};
		std::string name{};
		std::string description{};
		std::shared_ptr<textworld::ecs::Entity> entity{};
	};
}

namespace textworld::components
{
	class LuaScriptActionComponent : public textworld::ecs::Component
	{
	public:
		LuaScriptActionComponent(std::string name, std::string script) : Component(name)
		{
			this->script = script;
		}

		auto get_script() const { return script; }

	private:
		std::string script;
	};

	class CommandInputComponent : public textworld::ecs::Component
	{
	public:
		CommandInputComponent(std::string name, std::string cmd) : Component(name)
		{
			command_with_arguments = cmd;

			std::stringstream ss(cmd);
			std::string token;
			while (std::getline(ss, token, ' '))
			{
				to_lower(token);

				if (command == "")
				{
					command = token;
				}
				else
				{
					arguments.push_back(token);
				}
			}
		}

		auto get_command() const { return command; }
		auto get_arguments() const { return arguments; }
		auto get_command_with_arguments() const { return command_with_arguments; }
		auto get_arguments_as_string() const
		{
			std::ostringstream oss;
			std::copy(arguments.begin(), arguments.end() - 1, std::ostream_iterator<std::string>(oss, " "));
			oss << arguments.back();
			return oss.str();
		}

	protected:
		std::string command{};
		std::vector<std::string> arguments{};
		std::string command_with_arguments{};		
	};

	class CommandActionComponent : public CommandInputComponent
	{
	public:
		CommandActionComponent(std::string name, std::string command, textworld::core::simple_action_func action) : CommandInputComponent(name, command), action(action) { }

		void run_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::string command, std::vector<std::string> arguments, std::shared_ptr<textworld::ecs::EntityManager> em)
		{
			action(player_entity, em);
		}

	private:
		textworld::core::simple_action_func action{};
	};

	class CurrencyComponent : public textworld::ecs::Component
	{
	public:
		CurrencyComponent(std::string name, int currency) : Component(name), currency(currency) { }

		auto get() const { return currency; }
		void set(int currency) { this->currency = currency; }
		void add(int currency) { this->currency += currency; }

	private:
		int currency{};
	};

	class DisplayNameComponent : public textworld::ecs::Component
	{
	public:
		DisplayNameComponent(std::string name, std::string display_name) : Component(name)
		{
			this->display_name = display_name;
		}

		auto get_display_name() const { return display_name; }

	private:
		std::string display_name{};
	};

	class DescriptionComponent : public textworld::ecs::Component
	{
	public:
		DescriptionComponent(std::string name, std::string description) : Component(name)
		{
			this->description = description;
		}

		auto get_description() const { return description; }

	private:
		std::string description{};
	};

	class ExitComponent : public textworld::ecs::Component
	{
	public:
		ExitComponent(std::string name, textworld::data::Direction direction, std::string room_id, bool hidden = false) : Component(name)
		{
			this->direction = direction;
			this->room_id = room_id;
			this->hidden = hidden;
		}

		auto get_direction() const { return direction; }
		auto get_direction_as_string()
		{
			auto dir = magic_enum::enum_name(direction);
			auto dir_s = std::string{ dir };
			to_lower(dir_s);
			return std::string{ dir_s };
		}
		auto get_room_id() const { return room_id; }
		auto is_hidden() const { return hidden; }
		void set_room_name(std::string room_name) { this->room_name = room_name; }
		auto get_room_name() const { return room_name; }

	private:
		textworld::data::Direction direction{};
		std::string room_name{};
		std::string room_id{};
		bool hidden{};
	};

	class IdComponent : public textworld::ecs::Component
	{
	public:
		IdComponent(std::string name, std::string target_id, textworld::data::IdType id_type) : Component(name)
		{
			this->target_id = target_id;
			this->id_type = id_type;
		}

		auto get_id_type() const { return id_type; }
		auto get_id() const { return target_id; }
		void set_id(std::string target_id) { this->target_id = target_id; }

	private:
		std::string target_id{};
		textworld::data::IdType id_type{};
	};

	class InventoryComponent : public textworld::ecs::Component
	{
	public:
		InventoryComponent(std::string name) : Component(name)
		{
			items = std::make_unique<std::vector<std::shared_ptr<textworld::data::ItemPickup>>>();
		}

		void add_item(textworld::data::ItemPickup item)
		{
			auto it = std::find_if(items->begin(), items->end(), [item](const auto& i)
				{ return i->id == item.id; });

			if (it == items->end())
			{
				items->push_back(std::make_shared<textworld::data::ItemPickup>(item));
			}
			else
			{
				(*it)->quantity += item.quantity;
			}
		}
		void remove_item(std::string item_id)
		{
			items->erase(std::remove_if(items->begin(), items->end(), [item_id](const auto& item)
				{ return item->id == item_id; }),
				items->end());
		}
		std::shared_ptr<textworld::data::ItemPickup> get_item(std::string item_id)
		{
			// loop over items and find item based on item_id using find_if
			auto it = std::find_if(items->begin(), items->end(), [item_id](const auto& item)
				{ return item->id == item_id; });

			if (it != items->end())
			{
				return *it;
			}

			return nullptr;
		}
		void clear_items() { items->clear(); }
		auto get_size() const { return items->size(); }

		void increment_item_count(std::string item_id, int count)
		{
			auto it = std::find_if(items->begin(), items->end(), [item_id](const auto& item)
				{ return item->id == item_id; });

			if (it != items->end())
			{
				(*it)->quantity += count;
			}
		}
		void decrement_item_count(std::string item_id, int count)
		{
			auto it = std::find_if(items->begin(), items->end(), [item_id](const auto& item)
				{ return item->id == item_id; });

			if (it != items->end())
			{
				(*it)->quantity -= count;
			}
		}

		auto get_items_string() const
		{
			std::stringstream ss;		
			auto first = begin(*items), last = end(*items);
			if (first != last) {                
				while (true) {
					ss << (*first)->name << ": (" << (*first)->quantity << ")";
					if (++first == last) break;
					ss << std::endl;					
				}
			}

			return ss.str();
		}

		void for_each(std::function<void(std::shared_ptr<textworld::data::ItemPickup>)> func)
		{
			for (const auto& item : *items)
			{
				func(item);
			}
		}

	private:
		std::unique_ptr<std::vector<std::shared_ptr<textworld::data::ItemPickup>>> items{};
	};

	class ItemComponent : public textworld::ecs::Component
	{
	public:
		ItemComponent(std::string name, std::shared_ptr<textworld::data::Item> item) : Component(name)
		{
			this->item = item;
		}

		auto get_item() const { return item; }

	private:
		std::shared_ptr<textworld::data::Item> item{};
	};

	class ItemDropComponent : public textworld::ecs::Component
	{
	public:
		ItemDropComponent(std::string name, std::string item_id, std::string item_name, int quantity) : Component(name)
		{
			item_pickup.id = item_id;
			item_pickup.name = item_name;
			item_pickup.quantity = quantity;
		}

		auto get_item_id() const { return item_pickup.id; }
		auto get_quantity() const { return item_pickup.quantity; }
		void set_quantity(int quantity) { item_pickup.quantity = quantity; }
		auto get_item_name() const { return item_pickup.name; }

	private:
		textworld::data::ItemPickup item_pickup;
	};

	class JsonComponent : public textworld::ecs::Component
	{
	public:
		JsonComponent(std::string name, std::string json) : Component(name)
		{
			this->json = json;
		}

		auto get_json() const { return json; }

	private:
		std::string json{};
	};

	class OutputComponent : public textworld::ecs::Component
	{
	public:
		OutputComponent(std::string name, std::string value, textworld::data::OutputType output_type = textworld::data::OutputType::REGULAR) : Component(name)
		{
			this->output_type = output_type;
			this->value = value;
		}

		auto get_output_type() const { return output_type; }
		auto get_value() const { return value; }

	private:
		textworld::data::OutputType output_type{};
		std::string value{};
	};

	class QuitComponent : public textworld::ecs::Component
	{
	public:
		QuitComponent(std::string name, std::function<void()> action) : Component(name)
		{
			this->action = action;
		}

		void run_action() { action(); }

	private:
		std::function<void()> action{};
	};

	class ShowDescriptionComponent : public textworld::ecs::Component
	{
	public:
		ShowDescriptionComponent(std::string name,
			std::shared_ptr<textworld::ecs::Entity> entity,
			textworld::data::DescriptionType description_type) : Component(name)
		{
			this->entity = entity;
			this->description_type = description_type;
		}

		ShowDescriptionComponent(std::string name,
			std::vector<std::shared_ptr<textworld::ecs::Entity>> entities,
			textworld::data::DescriptionType description_type) : Component(name)
		{
			this->description_type = description_type;
			this->entities = entities;
		}

		auto get_description_type() const { return description_type; }
		auto get_entity() const { return entity; }
		auto get_entities() const { return entities; }

	private:
		std::shared_ptr<textworld::ecs::Entity> entity{};
		std::vector<std::shared_ptr<textworld::ecs::Entity>> entities{};
		textworld::data::DescriptionType description_type{};
	};

	class StatsComponent : public textworld::ecs::Component
	{
	public:
		StatsComponent(std::string name, textworld::data::Stat health, textworld::data::Stat mana, textworld::data::Stat stamina) : Component(name)
		{
			this->health = health;
			this->mana = mana;
			this->stamina = stamina;
		}

		auto get_health() const { return health; }
		auto get_mana() const { return mana; }
		auto get_stamina() const { return stamina; }

		void set_health(textworld::data::Stat health) { this->health = health; }
		void set_mana(textworld::data::Stat mana) { this->mana = mana; }
		void set_stamina(textworld::data::Stat stamina) { this->stamina = stamina; }

		void add_health(int health) { this->health.current_value += health; }
		void add_mana(int mana) { this->mana.current_value += mana; }
		void add_stamina(int stamina) { this->stamina.current_value += stamina; }
		
	private:
		textworld::data::Stat health{};
		textworld::data::Stat mana{};
		textworld::data::Stat stamina{};
	};

	class UnknownCommandComponent : public textworld::ecs::Component
	{
	public:
		UnknownCommandComponent(std::string name, std::string command) : Component(name)
		{
			this->command = command;
		}

		auto get_command() const { return command; }

	private:
		std::string command{};
	};
}

namespace textworld::helpers
{
	extern std::shared_ptr<textworld::ecs::Entity> get_players_current_room(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern std::shared_ptr<textworld::components::ShowDescriptionComponent> get_room_exits(std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::shared_ptr<textworld::ecs::Entity> room_entity);
	extern void add_item_to_player_inventory(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::shared_ptr<textworld::ecs::Entity> entity);
	extern void remove_or_decrement_item_in_inventory(std::shared_ptr<textworld::ecs::Entity> target_entity, std::shared_ptr<textworld::data::ItemPickup> inventory_item);
	extern std::string join(const std::vector<std::string>& v, const std::string& c);
	extern textworld::data::RoomInfo make_room(std::string name, std::string description);
	extern std::shared_ptr<textworld::data::Item> make_consumable_item(std::string name, std::string description, std::unordered_map<std::string, textworld::core::simple_action_func> actions);
}

namespace textworld::core
{
	extern void quit_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void show_item_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void show_all_items_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void take_item_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void take_all_items_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void drop_item_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void drop_all_items_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void use_item_from_inventory_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void look_self_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void look_room_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);

	extern textworld::data::Direction get_opposite_direction(textworld::data::Direction dir);
}

namespace textworld::systems
{
	extern void command_action_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void room_movement_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void unknown_command_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void description_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void quit_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void motd_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void console_output_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void console_input_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);	
	extern void inventory_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
}