#pragma once

// #define SOL_ALL_SAFETIES_ON 1

#include <concepts>
#include <ranges>
#include <map>
#include <numeric>
#include <queue>
#include <memory>
#include <functional>
#include <sstream>
#include <iostream>
#include <optional>
#include <random>

#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>

#include <fmt/core.h>
#include <fmt/ranges.h>
#include <magic_enum.hpp>
#include <sol/sol.hpp>

#define to_lower(s) transform(s.begin(), s.end(), s.begin(), ::tolower);
#define to_upper(s) transform(s.begin(), s.end(), s.begin(), ::toupper);
#define to_titlecase(s) \
	to_lower(s);          \
	s[0] = toupper(s[0]);

extern std::string generate_uuid();
extern std::string get_vector_of_strings_as_strings(std::vector<std::string> vec);

#define begin_room_configuration \
	{                              \
		std::unordered_map<std::string, textworld::data::RoomInfo> room_info{};

#define mk_rm(n, d)                                                                              \
	{                                                                                              \
		auto id = generate_uuid();                                                                   \
		auto room_entity = std::make_shared<textworld::ecs::Entity>(id, n);                          \
		auto room_description = std::make_shared<textworld::components::DescriptionComponent>(n, d); \
		room_entity->add_component(room_description);                                                \
		room_info[n] = {.id = id, .name = n, .description = d, .entity = room_entity};               \
	}

#define _mk_ex(fn, tn, d, h)                                                                                                                                                  \
	{                                                                                                                                                                           \
		auto from_room_info = room_info[fn];                                                                                                                                      \
		auto to_room_info = room_info[tn];                                                                                                                                        \
		auto from_exit_component = std::make_shared<textworld::components::ExitComponent>(fn, d, to_room_info.id, h);                                                             \
		auto to_exit_component = std::make_shared<textworld::components::ExitComponent>(to_room_info.name, textworld::core::get_opposite_direction(d), from_room_info.id, false); \
		from_room_info.entity->add_component(from_exit_component);                                                                                                                \
		to_room_info.entity->add_component(to_exit_component);                                                                                                                    \
		from_exit_component->set_room_name(tn);                                                                                                                                   \
		to_exit_component->set_room_name(fn);                                                                                                                                     \
	}

#define mk_ex(fn, tn, d) _mk_ex(fn, tn, d, false);
#define mk_ex_hidden(fn, tn, d) _mk_ex(fn, tn, d, true);

#define pl_it(rn, in, q)                                                                                        \
	{                                                                                                             \
		auto r_info = room_info[rn];                                                                                \
		auto item_entity = entity_manager->get_entity_by_name("items", in);                                         \
		auto item_component = item_entity->find_first_component_by_type<textworld::components::ItemComponent>();    \
		auto item = item_component->get_item();                                                                     \
		auto item_drop_component = std::make_shared<textworld::components::ItemDropComponent>(in, item->id, in, q); \
		r_info.entity->add_component(item_drop_component);                                                          \
	}

#define _mk_it(n, d, c, a)                                                                     \
	{                                                                                            \
		auto acts = std::unordered_map<std::string, textworld::core::action_func>{{"default", a}}; \
		std::shared_ptr<textworld::data::Item> i{};                                                \
		if (c)                                                                                     \
			i = textworld::helpers::make_consumable_item(n, d, acts);                                \
		else                                                                                       \
			i = textworld::helpers::make_item(n, d, acts);                                           \
		auto item_entity = std::make_shared<textworld::ecs::Entity>(i->id, n);                     \
		auto item_component = std::make_shared<textworld::components::ItemComponent>(n, i);        \
		item_entity->add_component(item_component);                                                \
		entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::ITEMS, item_entity);  \
	}

#define mk_it(n, d) _mk_it(n, d, false, nullptr);
#define mk_it_with_action(n, d, c, a) _mk_it(n, d, c, a);

#define mk_npc(n, d, r)                                                                                          \
	{                                                                                                              \
		auto npc_entity = std::make_shared<textworld::ecs::Entity>(n);                                               \
		auto npc_description = std::make_shared<textworld::components::DescriptionComponent>(n, d);                  \
		npc_entity->add_component(npc_description);                                                                  \
		auto npc_dialog_sequence_component = std::make_shared<textworld::components::DialogSequenceComponent>(n, r); \
		npc_entity->add_component(npc_dialog_sequence_component);                                                    \
		entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::NPCS, npc_entity);                      \
	}

#define pl_npc(ir, n)                                                                                                                                   \
	{                                                                                                                                                     \
		auto r_info = room_info[ir];                                                                                                                        \
		auto npc_entity = entity_manager->get_entity_by_name("npcs", n);                                                                                    \
		auto npc_id_component = std::make_shared<textworld::components::IdComponent>("npc current room", r_info.id, textworld::data::IdType::CURRENT_ROOM); \
		npc_entity->add_component(npc_id_component);                                                                                                        \
	}

#define mk_enemy(n, d, r)                                                                         \
	{                                                                                               \
		auto enemy_entity = std::make_shared<textworld::ecs::Entity>(n);                              \
		auto enemy_description = std::make_shared<textworld::components::DescriptionComponent>(n, d); \
		enemy_entity->add_component(enemy_description);                                               \
		entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::MOBS, npc_entity);       \
	}

#define print_rooms                                                                                          \
	{                                                                                                          \
		for (const auto &r : room_info)                                                                          \
		{                                                                                                        \
			fmt::print("{} -> {}\nExits:\n", r.first, r.second.id);                                                \
			for (const auto &e : r.second.entity->find_components_by_type<textworld::components::ExitComponent>()) \
				fmt::print("\t{} -> {}\n", e->get_room_name(), e->get_direction_as_string());                        \
		}                                                                                                        \
	}

#define end_room_configuration                                                                    \
	for (const auto &r : room_info)                                                                 \
		entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::ROOMS, r.second.entity); \
	}

namespace textworld::ecs
{
	enum class EntityGroupName
	{
		PLAYERS,
		NPCS,
		CORE,
		ROOMS,
		ITEMS,
		MOBS
	};

	enum class EntityType
	{
		UNKNOWN,
		PLAYER,
		MOB,
		NPC,
		ITEM,
		INTERACTABLE,
		GROUND,
		WALL,
		ROOM
	};

	extern std::string entity_group_name_to_string(textworld::ecs::EntityGroupName group_name);

	class Component
	{
	public:
		virtual ~Component(){};

		auto get_name() const { return component_name; }
		void set_name(std::string name) { component_name = name; }
		auto get_id() const { return id; }

		Component(std::string name, std::string id = generate_uuid()) : component_name(name)
		{
			this->id = id;
		}

	private:
		std::string component_name{};

	protected:
		std::string id{};
	};

	template <class T>
	concept ComponentType = std::is_base_of<textworld::ecs::Component, T>::value;

	class Entity
	{
	public:
		Entity(std::string name) : Entity(generate_uuid(), name) {}
		Entity(std::string id, std::string name) : Entity(id, name, EntityType::UNKNOWN) {}
		Entity(std::string id, std::string name, EntityType entity_type) : id(id), name(name), entity_type(entity_type)
		{
			components = std::make_unique<std::vector<std::shared_ptr<Component>>>();
		}

		template <ComponentType T>
		std::shared_ptr<T> find_first_component_by_type()
		{
			for (auto &c : *components)
			{
				auto casted = std::dynamic_pointer_cast<T>(c);

				if (casted != nullptr)
				{
					return casted;
				}
			}

			return nullptr;
		}

		template <ComponentType T>
		std::shared_ptr<T> find_first_component_by_name(std::string name)
		{
			std::vector<std::shared_ptr<T>> matches{};

			for (auto &c : *components)
			{
				auto casted = std::dynamic_pointer_cast<T>(c);

				if (casted != nullptr && casted->get_name() == name)
				{
					return casted;
				}
			}

			return nullptr;
		}

		template <ComponentType T>
		auto find_components_by_name(std::string name)
		{
			std::vector<std::shared_ptr<T>> matches{};

			for (auto &c : *components)
			{
				auto casted = std::dynamic_pointer_cast<T>(c);

				if (casted != nullptr && casted->get_name() == name)
				{
					matches.emplace_back(casted);
				}
			}

			return matches;
		}

		template <ComponentType T>
		auto find_components_by_type()
		{
			std::vector<std::shared_ptr<T>> matches{};

			for (auto &c : *components)
			{
				auto casted = std::dynamic_pointer_cast<T>(c);

				if (casted != nullptr)
				{
					matches.emplace_back(casted);
				}
			}

			return matches;
		}

		template <ComponentType T>
		auto find_components_by_type(std::function<bool(std::shared_ptr<T>)> predicate)
		{
			std::vector<std::shared_ptr<T>> matches{};

			for (auto &c : *components)
			{
				auto casted = std::dynamic_pointer_cast<T>(c);

				if (casted != nullptr && predicate(casted))
				{
					matches.emplace_back(casted);
				}
			}

			return matches;
		}

		std::string get_name() { return name; }
		auto get_id() const { return id; }
		void add_component(std::shared_ptr<Component> c) { components->emplace_back(c); }
		void add_components(std::vector<std::shared_ptr<Component>> c) { components->insert(components->end(), c.begin(), c.end()); }

		template <ComponentType T>
		void remove_components(std::vector<std::shared_ptr<T>> c)
		{
			for (auto &component : c)
			{
				auto it = std::find(components->begin(), components->end(), component);
				if (it != components->end())
				{
					components->erase(it);
				}
			}
		}

		template <ComponentType T>
		void remove_component(std::shared_ptr<T> component)
		{
			auto it = std::find(components->begin(), components->end(), component);
			if (it != components->end())
			{
				components->erase(it);
			}
		}

		void for_each_component(std::function<void(std::shared_ptr<Component> &)> fc)
		{
			for (auto &c : *components)
			{
				fc(c);
			}
		}

		void clear_components() { components->clear(); }

		auto get_component_count() const { return components->size(); }

		void set_entity_type(textworld::ecs::EntityType type) { entity_type = type; }

	private:
		std::string id;
		EntityType entity_type{EntityType::UNKNOWN};

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

		void add_entity_to_group(std::string group_name, std::shared_ptr<Entity> e);
		void add_entity_to_group(EntityGroupName group_name, std::shared_ptr<Entity> e)
		{
			add_entity_to_group(entity_group_name_to_string(group_name), e);
		}

		std::shared_ptr<EntityGroup> create_entity_group(std::string group_name);
		std::shared_ptr<Entity> create_entity_in_group(std::string group_name, std::string entity_name);
		bool remove_entity(std::string entity_group_name, std::string entity_id);

		std::vector<std::string> get_entity_group_names()
		{
			std::vector<std::string> results{};
			for (auto &eg : *entity_groups)
			{
				results.emplace_back(eg->name);
			}
			return results;
		}
		std::shared_ptr<EntityGroup> get_entity_group(std::string group_name);
		std::shared_ptr<EntityGroup> get_entity_group(EntityGroupName group_name)
		{
			return get_entity_group(entity_group_name_to_string(group_name));
		}
		std::shared_ptr<std::vector<std::shared_ptr<Entity>>> get_entities_in_group(std::string group_name);
		std::shared_ptr<std::vector<std::shared_ptr<Entity>>> get_entities_in_group(EntityGroupName group_name)
		{
			return get_entities_in_group(entity_group_name_to_string(group_name));
		}

		std::string get_entity_id_by_name(std::string group_name, std::string entity_name);
		std::shared_ptr<Entity> get_entity_by_name(std::string group_name, std::string entity_name);
		std::shared_ptr<Entity> get_entity_by_name(EntityGroupName group_name, std::string entity_name)
		{
			return get_entity_by_name(entity_group_name_to_string(group_name), entity_name);
		}
		std::shared_ptr<Entity> get_entity_by_id(std::string group_name, std::string entity_id);
		std::shared_ptr<Entity> get_entity_by_id(EntityGroupName group_name, std::string entity_id)
		{
			return get_entity_by_id(entity_group_name_to_string(group_name), entity_id);
		}

		template <typename T>
		auto find_entities_by_component_type(std::string entity_group, std::function<bool(std::shared_ptr<T>)> predicate)
		{
			auto group = get_entity_group(entity_group);

			std::vector<std::shared_ptr<Entity>> matches{};
			for (auto &e : *group->entities)
			{
				auto result = e->find_component_by_type<T>(predicate);
				if (result.size() > 0)
				{
					matches.emplace_back(e);
				}
			}

			return matches;
		}

		std::shared_ptr<std::vector<std::shared_ptr<Entity>>> find_entities_in_group(std::string entity_group, std::function<bool(std::shared_ptr<Entity>)> predicate);

		std::shared_ptr<Entity> find_entity(std::string entity_group, std::function<bool(std::shared_ptr<Entity>)> predicate);
		std::shared_ptr<Entity> find_entity(EntityGroupName entity_group, std::function<bool(std::shared_ptr<Entity>)> predicate)
		{
			return find_entity(entity_group_name_to_string(entity_group), predicate);
		}

	private:
		std::unique_ptr<std::vector<std::shared_ptr<EntityGroup>>> entity_groups{};
	};
}

namespace textworld::core
{
	// FIXME: The action function should return a boolean here to let systems know if the action was successful or not
	typedef std::function<void(std::shared_ptr<textworld::ecs::Entity>, std::shared_ptr<textworld::ecs::EntityManager>)> action_func;

	extern std::unordered_map<std::string, action_func> command_actions;
}

namespace textworld::data
{
	enum class CommandSet
	{
		CORE,
		NPC,
		ROOM,
		OTHER
	};

	enum class TriggerType
	{
		ENTER,
		EXIT,
		USE,
		TAKE,
		DROP,
		LOOK,
		ENTER_TALK,
		EXIT_TALK,
		ATTACK,
		MOVE,
		OPEN,
		CLOSE,
		GIVE,
		SHOW,
		DESCRIPTION
	};

	enum class Flag
	{
		NONE,
		COMMAND_ACTION_SYSTEM_BYPASS,
		ROOM_DESCRIPTION_SYSTEM_BYPASS,
		ROOM_MOVEMENT_SYSTEM_BYPASS,
		INVENTORY_SYSTEM_BYPASS,
		NPC_DIALOG_SYSTEM_BYPASS,
		NPC_DIALOG_ENGAGEMENT,
		DESCRIPTION_SYSTEM_BYPASS,
		QUESTION_RESPONSE_SEQUENCE_SYSTEM_BYPASS,
		COMBAT_SYSTEM_BYPASS,
		LUA_SCRIPT_SYSTEM_BYPASS,
	};

	enum class Direction
	{
		UNKNOWN,
		NORTH,
		NORTHEAST,
		NORTHWEST,
		SOUTH,
		SOUTHEAST,
		SOUTHWEST,
		EAST,
		WEST,
		UP,
		DOWN,
		LEFT,
		RIGHT
	};

	enum class DescriptionType
	{
		ROOM,
		EXIT,
		ITEM,
		SELF,
		NPC
	};

	enum class OutputType
	{
		MESSAGE_OF_THE_DAY,
		REGULAR,
		COMMAND,
		SEPARATOR
	};

	enum class IdType
	{
		CURRENT_ROOM,
		ITEM,
		PLAYER,
		NPC,
		ENEMY,
		ZONE,
		DATA
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
		std::unordered_map<std::string, textworld::core::action_func> actions{};
	};

	struct ItemPickup
	{
		std::string id{};
		std::string name{};
		int quantity{};
	};

	struct QuestStep
	{
		// TODO: ???
	};

	struct Quest
	{
		// This isn't fully fleshed out. Not currently sure how we'll track individual quest steps
		std::string id{};
		std::string name{};
		std::string description{};
		std::string location_id{};
		std::vector<QuestStep> steps{};
		std::unordered_map<std::string, std::string> scripts{};
	};

	struct RoomInfo
	{
		std::string id{};
		std::string name{};
		std::string description{};
		std::shared_ptr<textworld::ecs::Entity> entity{};
	};

	struct TriggerInfo
	{
		TriggerType type{};
		std::string command{};
		std::string json_data{};
		std::vector<std::string> arguments{};
		textworld::core::action_func func{};
	};

	extern std::string command_set_to_string(CommandSet command_set);
}

namespace textworld::components
{
	class LuaScriptComponent : public textworld::ecs::Component
	{
	public:
		LuaScriptComponent(std::string name, std::string script) : Component(name), script(script) {}

		auto get_script() const { return script; }
		void set_script(std::string script) { this->script = script; }

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
					arguments.emplace_back(token);
				}
			}

			tokens.emplace_back(command);
			tokens.insert(tokens.end(), arguments.begin(), arguments.end());
		}

		auto get_command() const { return command; }
		auto get_arguments() const { return arguments; }
		auto get_command_with_arguments() const { return command_with_arguments; }
		auto get_arguments_as_string() const { return get_vector_of_strings_as_strings(arguments); }

		auto get_tokens() const { return tokens; }

	protected:
		std::string command{};
		std::vector<std::string> arguments{};
		std::string command_with_arguments{};
		std::vector<std::string> tokens{};
	};

	class CommandActionComponent : public CommandInputComponent
	{
	public:
		CommandActionComponent(std::string name, std::string command, textworld::core::action_func action) : CommandInputComponent(name, command), action(action) {}

		void run_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::string command, std::vector<std::string> arguments, std::shared_ptr<textworld::ecs::EntityManager> em)
		{
			action(player_entity, em);
		}

	private:
		textworld::core::action_func action{};
	};

	class CommandSetComponent : public textworld::ecs::Component
	{
	public:
		CommandSetComponent(textworld::data::CommandSet name) : Component(textworld::data::command_set_to_string(name)) {}
		CommandSetComponent(textworld::data::CommandSet name, std::unordered_map<std::string, textworld::core::action_func> command_set) : Component(textworld::data::command_set_to_string(name)), command_set(command_set) {}

		auto get_command_set() const { return command_set; }
		void add_command(std::string command, textworld::core::action_func action)
		{
			command_set.insert({command, action});
		}

		void add_command_set(std::unordered_map<std::string, textworld::core::action_func> command_set)
		{
			this->command_set = command_set;
		}

		void remove_command(std::string command) { command_set.erase(command); }
		void clear_commands() { command_set.clear(); }

		bool has_command(std::string command) const { return command_set.find(command) != command_set.end(); }

		void run_command(std::shared_ptr<textworld::ecs::Entity> player_entity, std::string command, std::vector<std::string> arguments, std::shared_ptr<textworld::ecs::EntityManager> em)
		{
			if (command_set.find(command) != command_set.end())
			{
				command_set[command](player_entity, em);
			}
		}

		// get commands
		std::unordered_map<std::string, textworld::core::action_func> get_commands() const { return command_set; }

	private:
		std::unordered_map<std::string, textworld::core::action_func> command_set{};
	};

	class DisplayNameComponent : public textworld::ecs::Component
	{
	public:
		DisplayNameComponent(std::string name, std::string display_name) : Component(name), display_name(display_name) {}

		auto get_display_name() const { return display_name; }

	private:
		std::string display_name{};
	};

	class DescriptionComponent : public textworld::ecs::Component
	{
	public:
		DescriptionComponent(std::string name, std::string description) : Component(name), description(description) {}

		auto get_description() const { return description; }

	private:
		std::string description{};
	};

	class ExitComponent : public textworld::ecs::Component
	{
	public:
		ExitComponent(std::string name, textworld::data::Direction direction, std::string room_id, bool hidden)
				: Component(name), direction(direction), room_id(room_id), hidden(hidden) {}

		auto get_direction() const { return direction; }
		auto get_direction_as_string()
		{
			auto dir = magic_enum::enum_name(direction);
			auto dir_s = std::string{dir};
			to_lower(dir_s);
			return std::string{dir_s};
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
		IdComponent(std::string name, std::string target_id, textworld::data::IdType id_type)
				: Component(name), target_id(target_id), id_type(id_type) {}

		auto get_id_type() const { return id_type; }
		auto get_target_id() const { return target_id; }
		void set_target_id(std::string target_id) { this->target_id = target_id; }

		void add_meta_data(std::string key, std::string value) { meta_data[key] = value; }
		auto get_meta_data() const { return meta_data; }
		auto get_meta_data(std::string key) const { return meta_data.at(key); }
		auto has_meta_data(std::string key) const { return meta_data.find(key) != meta_data.end(); }
		auto get_meta_data_as_string() const
		{
			std::ostringstream oss;
			for (auto &[key, value] : meta_data)
			{
				oss << key << ": " << value << std::endl;
			}
			return oss.str();
		}

	private:
		std::string target_id{};
		textworld::data::IdType id_type{};
		std::unordered_map<std::string, std::string> meta_data{};
	};

	class InventoryComponent : public textworld::ecs::Component
	{
	public:
		InventoryComponent(std::string name) : Component(name)
		{
			items = std::make_unique<std::vector<std::shared_ptr<textworld::data::ItemPickup>>>();
		}
		InventoryComponent(std::string name, std::vector<textworld::data::ItemPickup> items) : InventoryComponent(name)
		{
			for (auto &item : items)
			{
				add_item(item);
			}
		}

		void add_item(textworld::data::ItemPickup item)
		{
			auto it = std::find_if(items->begin(), items->end(), [item](const auto &i)
														 { return i->id == item.id; });

			if (it == items->end())
			{
				items->emplace_back(std::make_shared<textworld::data::ItemPickup>(item));
			}
			else
			{
				(*it)->quantity += item.quantity;
			}
		}
		void remove_item(std::string item_id)
		{
			items->erase(std::remove_if(items->begin(), items->end(), [item_id](const auto &item)
																	{ return item->id == item_id; }),
									 items->end());
		}
		std::shared_ptr<textworld::data::ItemPickup> get_item(std::string item_id)
		{
			// loop over items and find item based on item_id using find_if
			auto it = std::find_if(items->begin(), items->end(), [item_id](const auto &item)
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
			auto it = std::find_if(items->begin(), items->end(), [item_id](const auto &item)
														 { return item->id == item_id; });

			if (it != items->end())
			{
				(*it)->quantity += count;
			}
		}
		void decrement_item_count(std::string item_id, int count)
		{
			auto it = std::find_if(items->begin(), items->end(), [item_id](const auto &item)
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
			if (first != last)
			{
				while (true)
				{
					ss << (*first)->name << ": (" << (*first)->quantity << ")";
					if (++first == last)
						break;
					ss << std::endl;
				}
			}

			return ss.str();
		}

		void for_each(std::function<void(std::shared_ptr<textworld::data::ItemPickup>)> func)
		{
			for (const auto &item : *items)
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
		ItemComponent(std::string name, std::shared_ptr<textworld::data::Item> item)
				: Component(name), item(item) {}

		auto get_item() const { return item; }
		void set_item(std::shared_ptr<textworld::data::Item> item) { this->item = item; }

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
		auto get_item_pickup() const { return item_pickup; }

	private:
		textworld::data::ItemPickup item_pickup;
	};

	class JsonComponent : public textworld::ecs::Component
	{
	public:
		JsonComponent(std::string name, std::string json)
				: Component(name), json(json) {}

		auto get_json() const { return json; }
		void set_json(std::string json) { this->json = json; }

	private:
		std::string json{};
	};

	class OutputComponent : public textworld::ecs::Component
	{
	public:
		OutputComponent(std::string name, std::string value, textworld::data::OutputType output_type = textworld::data::OutputType::REGULAR)
				: Component(name), value(value), output_type(output_type) {}

		auto get_output_type() const { return output_type; }
		auto get_value() const { return value; }
		void set_value(std::string value) { this->value = value; }
		void set_output_type(textworld::data::OutputType output_type) { this->output_type = output_type; }

	private:
		textworld::data::OutputType output_type{};
		std::string value{};
	};

	class QuitComponent : public textworld::ecs::Component
	{
	public:
		QuitComponent(std::string name, std::function<void()> action)
				: Component(name), action(action) {}

		void run_action() { action(); }

	private:
		std::function<void()> action{};
	};

	class ShowDescriptionComponent : public textworld::ecs::Component
	{
	public:
		ShowDescriptionComponent(std::string name,
														 std::shared_ptr<textworld::ecs::Entity> entity,
														 textworld::data::DescriptionType description_type)
				: Component(name), entity(entity), description_type(description_type) {}

		ShowDescriptionComponent(std::string name,
														 std::vector<std::shared_ptr<textworld::ecs::Entity>> entities,
														 textworld::data::DescriptionType description_type)
				: Component(name), entities(entities), description_type(description_type) {}

		auto get_description_type() const { return description_type; }
		auto get_entity() const { return entity; }
		auto get_entities() const { return entities; }

	private:
		std::shared_ptr<textworld::ecs::Entity> entity{};
		std::vector<std::shared_ptr<textworld::ecs::Entity>> entities{};
		textworld::data::DescriptionType description_type{};
	};

	template <class T>
	concept Value = std::is_integral_v<T> || std::is_floating_point_v<T>;

	template <Value T>
	class ValueComponent : public textworld::ecs::Component
	{
	public:
		void add(T value)
		{
			auto new_value = this->value + value;

			if (this->value + value > max_value)
			{
				this->value = max_value;
				return;
			}

			this->value = new_value;
		}
		void sub(T value)
		{
			auto new_value = this->value - value;

			if (this->value - value < 0)
			{
				this->value = 0;
				return;
			}

			this->value = new_value;
		}
		void set_value(T value)
		{
			(this->value > max_value) ? this->value = max_value : this->value = value;
		}
		T get_value() const { return value; }

		void add_max(T value) { this->max_value += value; }
		void sub_max(T value)
		{
			(this->max_value - value < 0) ? this->max_value = 0 : this->max_value -= value;
		}
		void set_max_value(T max_value) { this->max_value = max_value; }
		T get_max_value() const { return max_value; }

		ValueComponent(std::string name, T value) : Component(name), value(value), max_value(value) {}
		ValueComponent(std::string name, T value, T max_value) : Component(name), value(value), max_value(max_value) {}

	private:
		T value{};
		T max_value{};
	};

	class UnknownCommandComponent : public textworld::ecs::Component
	{
	public:
		UnknownCommandComponent(std::string name, std::string command)
				: Component(name), command(command) {}

		auto get_command() const { return command; }

	private:
		std::string command{};
	};

	class DialogSequenceComponent : public textworld::ecs::Component
	{
	public:
		DialogSequenceComponent(std::string name,
														std::unordered_map<std::string, std::tuple<std::string, textworld::core::action_func>> responses) : Component(name)
		{
			for (auto &[key, value] : responses)
			{
				this->responses[key] = value;
			}
		}

		void add_response(std::string trigger, std::string response, textworld::core::action_func action = nullptr) { responses[trigger] = std::make_tuple(response, action); }
		std::optional<std::tuple<std::string, textworld::core::action_func>> get_response(std::string trigger) const
		{
			auto it = responses.find(trigger);

			if (it != responses.end())
			{
				return std::optional<std::tuple<std::string, textworld::core::action_func>>{it->second};
			}

			return std::nullopt;
		}

		auto get_responses() const { return responses; }

	private:
		std::unordered_map<std::string, std::tuple<std::string, textworld::core::action_func>> responses{};
	};

	class QuestionResponseSequenceComponent : public textworld::ecs::Component
	{
	public:
		QuestionResponseSequenceComponent(std::string name, std::vector<std::string> questions) : Component(name), questions(questions) {}

		void add_response(std::string response)
		{
			waiting_for_answer = false;
			responses.emplace_back(response);
		}

		auto get_response_count() const { return responses.size(); }
		auto get_question_count() const { return questions.size(); }

		auto get_question(size_t index) const { return questions[index]; }
		auto get_response(size_t index) const { return responses[index]; }

		void set_waiting_for_answer(bool waiting_for_answer) { this->waiting_for_answer = waiting_for_answer; }
		auto get_waiting_for_answer() const { return waiting_for_answer; }

	private:
		std::vector<std::string> responses{};
		std::vector<std::string> questions{};
		bool waiting_for_answer = false;
	};

	class ComponentsOnHoldComponent : public textworld::ecs::Component
	{
	public:
		ComponentsOnHoldComponent(std::string name) : Component(name)
		{
			on_hold_entity = std::make_unique<textworld::ecs::Entity>("on hold");
		}

		template <textworld::ecs::ComponentType T>
		void place_component_on_hold(std::shared_ptr<textworld::ecs::Entity> entity)
		{
			auto components = entity->find_components_by_type<T>();

			for (auto &component : components)
			{
				on_hold_entity->add_component(component);
				entity->remove_component(component);
			}
		}

		template <textworld::ecs::ComponentType T>
		void release_component_from_hold(std::shared_ptr<textworld::ecs::Entity> entity)
		{
			auto components = on_hold_entity->find_components_by_type<T>();

			for (auto &component : components)
			{
				entity->add_component(component);
				on_hold_entity->remove_component(component);
			}
		}

		void release_all_components_from_hold(std::shared_ptr<textworld::ecs::Entity> entity)
		{
			on_hold_entity->for_each_component([entity](std::shared_ptr<Component> &component)
																				 { entity->add_component(component); });

			on_hold_entity->clear_components();
		}

		auto get_component_count() const { return on_hold_entity->get_component_count(); }

	private:
		std::unique_ptr<textworld::ecs::Entity> on_hold_entity{};
	};

	class FlagComponent : public textworld::ecs::Component
	{
	public:
		FlagComponent(std::string name) : Component(name) {}
		FlagComponent(std::string name, textworld::data::Flag flag) : Component(name) { set_flag(flag); }
		FlagComponent(std::string name, std::vector<textworld::data::Flag> flags) : Component(name), flags(flags) {}

		bool is_set(textworld::data::Flag flag)
		{
			return std::find(flags.begin(), flags.end(), flag) != flags.end();
		}

		void set_flag(textworld::data::Flag flag)
		{
			if (!is_set(flag))
				flags.emplace_back(flag);
		}

		void unset_flag(textworld::data::Flag flag)
		{
			auto it = std::find(flags.begin(), flags.end(), flag);

			if (it != flags.end())
				flags.erase(it);
		}

		void set_data(std::string data) { this->flag_data = data; }
		auto get_data() const { return flag_data; }

	private:
		std::string flag_data{};
		std::vector<textworld::data::Flag> flags{};
	};

	class QuestComponent : public textworld::ecs::Component
	{
	public:
		QuestComponent(std::string name, std::shared_ptr<textworld::data::Quest> quest) : Component(name), quest(quest) {}

	private:
		std::shared_ptr<textworld::data::Quest> quest{};
	};

	class TriggerComponent : public textworld::ecs::Component
	{
	public:
		TriggerComponent(std::string name) : Component(name)
		{
			triggers = std::make_unique<std::unordered_map<textworld::data::TriggerType, std::vector<textworld::data::TriggerInfo>>>();
		}
		TriggerComponent(std::string name, textworld::data::TriggerType trigger_type, textworld::data::TriggerInfo trigger) : TriggerComponent(name)
		{
			add_trigger(trigger_type, trigger);
		}

		void add_trigger(textworld::data::TriggerType type, textworld::data::TriggerInfo trigger)
		{
			auto it = triggers->find(type);
			if (it == triggers->end())
				(*triggers)[type] = std::vector<textworld::data::TriggerInfo>{};
			(*triggers)[type].emplace_back(trigger);
		}

		std::optional<std::vector<textworld::data::TriggerInfo>> get_triggers_for_type(textworld::data::TriggerType type) const
		{
			auto it = triggers->find(type);
			if (it != triggers->end())
				return it->second;
			return std::nullopt;
		}

		void remove_triggers(textworld::data::TriggerType type)
		{
			auto it = triggers->find(type);
			if (it != triggers->end())
				triggers->erase(it);
		}

	private:
		std::unique_ptr<std::unordered_map<textworld::data::TriggerType, std::vector<textworld::data::TriggerInfo>>> triggers{};
	};

	class LootTableComponent : public textworld::ecs::Component
	{
	public:
		LootTableComponent(std::string name) : Component(name)
		{
			loot_table = std::make_unique<std::vector<std::string>>();
		}

		void add_item(std::string item_id) { loot_table->emplace_back(item_id); }
		void remove_item(std::string item_id)
		{
			auto it = std::find(loot_table->begin(), loot_table->end(), item_id);
			if (it != loot_table->end())
				loot_table->erase(it);
		}
		auto get_loot(size_t num) const
		{
			std::vector<std::string> loot{};

			if (num > loot_table->size())
				num = loot_table->size();

			std::sample(loot_table->begin(), loot_table->end(), std::back_inserter(loot), num, std::mt19937{std::random_device{}()});
		}

	private:
		std::unique_ptr<std::vector<std::string>> loot_table{};
	};

	class DamageComponent : public textworld::ecs::Component
	{
	public:
		DamageComponent(std::string name, int damage) : Component(name), damage(damage) {}

		auto get_damage() const { return damage; }

	private:
		int damage{};
	};
}

namespace textworld::helpers
{
	extern std::shared_ptr<textworld::ecs::Entity> get_players_current_room(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern std::shared_ptr<textworld::components::ShowDescriptionComponent> get_room_exits(std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::shared_ptr<textworld::ecs::Entity> room_entity);
	extern void add_item_to_player_inventory(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::shared_ptr<textworld::ecs::Entity> entity);
	extern void add_item_to_player_inventory(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::string item_name);
	extern void remove_or_decrement_item_in_inventory(std::shared_ptr<textworld::ecs::Entity> target_entity, std::shared_ptr<textworld::data::ItemPickup> inventory_item);
	extern std::string join(const std::vector<std::string> &v, const std::string &c);
	extern textworld::data::RoomInfo make_room(std::string name, std::string description);
	extern std::shared_ptr<textworld::data::Item> make_item(std::string name, std::string description, std::unordered_map<std::string, textworld::core::action_func> actions);
	extern std::shared_ptr<textworld::data::Item> make_consumable_item(std::string name, std::string description, std::unordered_map<std::string, textworld::core::action_func> actions);
	extern std::shared_ptr<std::vector<std::shared_ptr<textworld::ecs::Entity>>> get_npcs_in_room(std::string room_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void use_item_and_return_message(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::string message);
	extern std::shared_ptr<textworld::ecs::Entity> make_player(std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::string name, std::string room_id, std::string description, std::string motd_description);
	extern std::shared_ptr<textworld::ecs::Entity> make_enemy(std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::string name, std::string room_id, std::string description);
	extern std::shared_ptr<textworld::ecs::EntityManager> make_entity_manager();
	extern void add_output_message(std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::string message);
	extern void remove_npc_engagement_flag_from_player(std::shared_ptr<textworld::ecs::Entity> player_entity);

	// DEBUG
	extern void debug_items(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);

	template <typename T>
	T find_value_in_map(std::unordered_map<std::string, T> map, std::string key, std::vector<std::string> keys)
	{
		auto found = map.find(key);
		if (found != map.end())
			return found->second;

		int count = 0;
		std::string command{};
		for (const auto &k : keys)
		{
			if (count + 1 < keys.size())
			{
				command += k;

				if (map[command] != nullptr)
				{
					return map[command];
				}
			}
			else
			{
				return nullptr;
			}

			command += " ";
			count++;
		}

		return nullptr;
	}

	template <typename T>
	void increase_value_on_entity_value_component(std::shared_ptr<textworld::ecs::Entity> player_entity, std::string component_name, T value)
	{
		auto component = player_entity->find_first_component_by_name<textworld::components::ValueComponent<T>>(component_name);

		if (component != nullptr)
		{
			component->add(value);
		}
	}

	template <typename T>
	void decrease_value_on_entity_value_component(std::shared_ptr<textworld::ecs::Entity> player_entity, std::string component_name, T value)
	{
		auto component = player_entity->find_first_component_by_name<textworld::components::ValueComponent<T>>(component_name);

		if (component != nullptr)
		{
			component->sub(value);
		}
	}
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
	extern void talk_to_npc(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void say_to_npc(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void engage_enemy_in_combat(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);

	extern textworld::data::Direction get_opposite_direction(textworld::data::Direction dir);
}

namespace textworld::systems
{
	extern void command_action_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void room_movement_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void unknown_command_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void description_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void quit_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void motd_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void console_output_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void console_input_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void inventory_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void question_response_sequence_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void combat_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
	extern void lua_script_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager);
}