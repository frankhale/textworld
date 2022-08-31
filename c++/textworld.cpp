#include "textworld.h"

std::string generate_uuid()
{
	boost::uuids::random_generator gen;
	boost::uuids::uuid id = gen();
	return boost::uuids::to_string(id);
}

std::string get_vector_of_strings_as_strings(std::vector<std::string> vec)
{
	if (vec.size() == 0)
		return std::string{};

	std::ostringstream oss;
	std::copy(vec.begin(), vec.end() - 1, std::ostream_iterator<std::string>(oss, " "));
	oss << vec.back();
	return oss.str();
}

namespace textworld::data
{
	std::string command_set_to_string(CommandSet command_set_name)
	{
		auto csn = std::string(magic_enum::enum_name(command_set_name));
		to_lower(csn);
		return csn;
	}
}

namespace textworld::helpers
{
	std::shared_ptr<textworld::ecs::Entity> get_players_current_room(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		if (player_entity != nullptr)
		{
			auto room_id_component = player_entity->find_components_by_type<textworld::components::IdComponent>([](std::shared_ptr<textworld::components::IdComponent> id_component)
				{ return id_component->get_id_type() == textworld::data::IdType::CURRENT_ROOM; });

			if (room_id_component.size() > 0)
			{
				auto current_room_id = room_id_component[0]->get_target_id();
				if (current_room_id != "")
				{
					// get current room entity from entity manager
					return entity_manager->get_entity_by_id("rooms", current_room_id);
				}
			}
		}

		return nullptr;
	}

	std::shared_ptr<textworld::components::ShowDescriptionComponent> get_room_exits(std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::shared_ptr<textworld::ecs::Entity> room_entity)
	{
		auto exits = room_entity->find_components_by_type<textworld::components::ExitComponent>();

		if (exits.size() > 0)
		{
			std::vector<std::string> exit_info{};
			std::vector<std::string> exit_ids{};
			std::unordered_map<std::string, std::shared_ptr<textworld::components::ExitComponent>> exit_map{};

			for (const auto& exit : exits)
			{
				if (!exit->is_hidden())
				{
					exit_ids.emplace_back(exit->get_room_id());
					exit_map[exit->get_room_id()] = exit;
				}
			}

			auto exit_room_entities = entity_manager->find_entities_in_group("rooms",
				[&](std::shared_ptr<textworld::ecs::Entity> entity)
				{
					return std::find(exit_ids.begin(), exit_ids.end(), entity->get_id()) != exit_ids.end();
				});

			for (const auto& room_entity : *exit_room_entities)
			{
				auto direction = std::string{ magic_enum::enum_name(exit_map[room_entity->get_id()]->get_direction()) };
				to_titlecase(direction);
				exit_info.emplace_back(fmt::format("{} : {}", direction, room_entity->get_name()));
			}

			auto full_exit_info = fmt::format("Exits: {}", exit_info);

			return std::make_shared<textworld::components::ShowDescriptionComponent>(
				full_exit_info,
				*exit_room_entities,
				textworld::data::DescriptionType::EXIT);
		}
		else
		{
			std::vector<std::shared_ptr<textworld::ecs::Entity>> empty_room_entities{};
			return std::make_shared<textworld::components::ShowDescriptionComponent>("No exits", empty_room_entities, textworld::data::DescriptionType::EXIT);
		}

		return nullptr;
	}

	void add_item_to_player_inventory(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::shared_ptr<textworld::ecs::Entity> entity)
	{
		auto inventory_components = player_entity->find_components_by_type<textworld::components::InventoryComponent>();
		auto item_drop_components = entity->find_components_by_type<textworld::components::ItemDropComponent>();

		if (inventory_components.size() > 0 && item_drop_components.size() > 0)
		{
			std::shared_ptr<textworld::components::InventoryComponent> inventory_component = inventory_components.front();
			std::shared_ptr<textworld::components::ItemDropComponent> item_drop_component = item_drop_components.front();

			auto item = inventory_component->get_item(item_drop_component->get_item_id());

			if (item != nullptr)
			{
				item->quantity += item_drop_component->get_quantity();
			}
			else
			{
				// add item to inventory
				inventory_component->add_item({ .id = item_drop_component->get_item_id(),
																			 .name = item_drop_component->get_item_name(),
																			 .quantity = item_drop_component->get_quantity() });
			}

			entity->remove_component(item_drop_component);
		}
	}

	void remove_or_decrement_item_in_inventory(std::shared_ptr<textworld::ecs::Entity> target_entity, std::shared_ptr<textworld::data::ItemPickup> inventory_item)
	{
		auto inventory_components = target_entity->find_components_by_type<textworld::components::InventoryComponent>();

		if (inventory_components.size() > 0)
		{
			std::shared_ptr<textworld::components::InventoryComponent> inventory_component = inventory_components.front();
			auto item = inventory_component->get_item(inventory_item->id);

			if (item != nullptr)
			{
				if (item->quantity > 1)
				{
					item->quantity--;
				}
				else
				{
					inventory_component->remove_item(inventory_item->id);
				}
			}
		}
	}

	std::string join(const std::vector<std::string>& v, const std::string& c)
	{
		std::stringstream ss;

		auto first = begin(v), last = end(v);
		if (first != last)
		{
			while (true)
			{
				ss << *first;
				if (++first == last)
					break;
				ss << std::endl;
			}
		}

		/*std::copy(v.begin(), v.end(), std::ostream_iterator<std::string>(ss, c.c_str()));*/

		return ss.str();
	}

	textworld::data::RoomInfo make_room(std::string name, std::string description)
	{
		auto room_id = generate_uuid();
		auto room_entity = std::make_shared<textworld::ecs::Entity>(name, room_id);
		auto room_description_component = std::make_shared<textworld::components::DescriptionComponent>("description component", description);
		room_entity->add_component(room_description_component);

		return { .id = room_id, .entity = room_entity };
	}

	std::shared_ptr<textworld::data::Item> make_item(std::string name, std::string description, std::unordered_map<std::string, textworld::core::action_func> actions)
	{
		auto i = textworld::data::Item{
				.id = generate_uuid(),
				.name = name,
				.description = description,
				.synonyms = {name},
				.quantity = 1,
				.is_container = false,
				.can_be_destroyed = true,
				.consumable = false,
				.lua_scripted_actions = {},
				.actions = {actions} };

		return std::make_shared<textworld::data::Item>(i);
	}

	std::shared_ptr<textworld::data::Item> make_consumable_item(std::string name, std::string description, std::unordered_map<std::string, textworld::core::action_func> actions)
	{
		auto i = textworld::data::Item{
				.id = generate_uuid(),
				.name = name,
				.description = description,
				.synonyms = {name},
				.quantity = 1,
				.is_container = false,
				.can_be_destroyed = true,
				.consumable = true,
				.lua_scripted_actions = {},
				.actions = {actions} };

		return std::make_shared<textworld::data::Item>(i);
	}

	std::shared_ptr<std::vector<std::shared_ptr<textworld::ecs::Entity>>> get_npcs_in_room(std::string room_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto npcs = entity_manager->get_entities_in_group(textworld::ecs::EntityGroupName::NPCS);
		auto room = entity_manager->get_entity_by_id(textworld::ecs::EntityGroupName::ROOMS, room_id);

		auto results = std::make_shared<std::vector<std::shared_ptr<textworld::ecs::Entity>>>();
		if (npcs->size() > 0 && room != nullptr)
		{
			for (const auto& npc : *npcs)
			{
				auto room_id_component = npc->find_first_component_by_type<textworld::components::IdComponent>();
				if (room_id_component != nullptr &&
					room_id_component->get_id_type() == textworld::data::IdType::CURRENT_ROOM &&
					room_id_component->get_target_id() == room->get_id())
				{
					results->emplace_back(npc);
				}
			}
		}

		if (results->size() > 0)
			return results;

		return nullptr;
	}

	void use_item_and_return_message(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::string message)
	{
		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");
		if (output_entity != nullptr)
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("item used", message);
			output_entity->add_component(output_component);
		}
	}

	std::shared_ptr<textworld::ecs::Entity> make_player(std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::string name, std::string starting_room_id, std::string description, std::string motd_description)
	{
		auto player_entity = std::make_shared<textworld::ecs::Entity>(name);

		auto id_component = std::make_shared<textworld::components::IdComponent>("room id component", starting_room_id, textworld::data::IdType::CURRENT_ROOM);
		auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("player inventory");
		auto health_component = std::make_shared<textworld::components::ValueComponent<int>>("health", 10, 100);
		auto description_component = std::make_shared<textworld::components::DescriptionComponent>("player description", description);
		auto currency_component = std::make_shared<textworld::components::ValueComponent<int>>("gold", 10);
		auto score_component = std::make_shared<textworld::components::ValueComponent<int>>("score", 0);
		auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
		auto motd_description_component = std::make_shared<textworld::components::DescriptionComponent>("motd", motd_description);		

		player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
				id_component,
				inventory_component,
				health_component,
				description_component,
				currency_component,
				score_component,
				command_set_component,
				motd_description_component});

		auto players_current_room = textworld::helpers::get_players_current_room(player_entity, entity_manager);
		auto show_current_room_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show current room description", players_current_room, textworld::data::DescriptionType::ROOM);
		auto show_npcs_in_room_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show NPCs in current room", player_entity, textworld::data::DescriptionType::NPC);

		player_entity->add_component(show_current_room_description_component);
		player_entity->add_component(show_npcs_in_room_description_component);
		player_entity->add_component(textworld::helpers::get_room_exits(entity_manager, players_current_room));

		entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::PLAYERS, player_entity);

		return player_entity;
	}

	std::shared_ptr<textworld::ecs::Entity> make_enemy(std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::string name, std::string room_id, std::string description)
	{
		auto enemy_entity = std::make_shared<textworld::ecs::Entity>(name);

		auto id_component = std::make_shared<textworld::components::IdComponent>("room id component", room_id, textworld::data::IdType::CURRENT_ROOM);
		auto health_component = std::make_shared<textworld::components::ValueComponent<int>>("health", 100, 100);
		auto description_component = std::make_shared<textworld::components::DescriptionComponent>("enemy description", description);

		enemy_entity->add_component(id_component);
		enemy_entity->add_component(health_component);
		enemy_entity->add_component(description_component);

		return enemy_entity;
	}

	std::shared_ptr<textworld::ecs::EntityManager> make_entity_manager()
	{
		auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
		auto output_entity = std::make_shared<textworld::ecs::Entity>("output");

		entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::CORE, output_entity);

		return entity_manager;
	}

	void add_output_message(std::shared_ptr<textworld::ecs::EntityManager> entity_manager, std::string message)
	{
		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");
		if (output_entity != nullptr)
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("output message", message);
			output_entity->add_component(output_component);
		}
	}

	void debug_items(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto items = entity_manager->get_entities_in_group(textworld::ecs::EntityGroupName::ITEMS);

		std::vector<std::string> item_names{};
		for (const auto& item : *items)
		{
			item_names.emplace_back(item->get_name());
		}

		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");
		auto output_component = std::make_shared<textworld::components::OutputComponent>("output message", fmt::format("(DEBUG) Items: \n\n{}", textworld::helpers::join(item_names, ", ")));
		output_entity->add_component(output_component);
	}
}

namespace textworld::ecs
{
	std::string entity_group_name_to_string(textworld::ecs::EntityGroupName group_name)
	{
		auto gn = std::string(magic_enum::enum_name(group_name));
		to_lower(gn);
		return gn;
	}

	std::shared_ptr<EntityGroup> EntityManager::create_entity_group(std::string group_name)
	{
		auto entityGroup = std::make_shared<EntityGroup>();
		entityGroup->name = group_name;
		entityGroup->entities = std::make_shared<std::vector<std::shared_ptr<Entity>>>();
		entity_groups->emplace_back(entityGroup);
		return entityGroup;
	}

	void EntityManager::add_entity_to_group(std::string group_name, std::shared_ptr<Entity> e)
	{
		auto group = get_entity_group(group_name);
		if (group == nullptr)
		{
			group = std::make_shared<EntityGroup>();
			group->name = group_name;
			group->entities = std::make_unique<std::vector<std::shared_ptr<Entity>>>();
			entity_groups->emplace_back(group);
		}
		group->entities->emplace_back(e);
	}

	std::shared_ptr<Entity> EntityManager::create_entity_in_group(std::string group_name, std::string entity_name)
	{
		auto entity = std::make_shared<Entity>(entity_name);
		auto entity_group = get_entity_group(group_name);
		if (entity_group != nullptr)
		{
			entity_group->entities->emplace_back(entity);
			return entity;
		}
		return nullptr;
	}

	bool EntityManager::remove_entity(std::string entity_group_name, std::string entity_id)
	{
		bool result = false;
		auto entity_group = get_entity_group(entity_group_name);

		if (entity_group != nullptr)
		{
			auto entity_to_remove_range = std::ranges::remove_if(*entity_group->entities,
				[&](std::shared_ptr<Entity> e)
				{
					if (e->get_id() == entity_id)
					{
						result = true;
						return true;
					}

					return false;
				});

			if (!entity_to_remove_range.empty())
			{
				entity_group->entities->erase(entity_to_remove_range.begin());
			}
		}

		return result;
	}

	std::shared_ptr<EntityGroup> EntityManager::get_entity_group(std::string group_name)
	{
		auto group = std::ranges::find_if(*entity_groups,
			[&](const std::shared_ptr<EntityGroup>& eg)
			{
				return eg->name == group_name;
			});

		if (group != entity_groups->end())
		{
			return *group;
		}

		return nullptr;
	}

	std::shared_ptr<std::vector<std::shared_ptr<Entity>>> EntityManager::get_entities_in_group(std::string group_name)
	{
		auto entity_group = get_entity_group(group_name);

		if (entity_group != nullptr)
		{
			return entity_group->entities;
		}

		return nullptr;
	}

	std::shared_ptr<Entity> EntityManager::get_entity_by_name(std::string entity_group, std::string entity_name)
	{
		return find_entity(entity_group, [&](const std::shared_ptr<Entity>& e)
			{ return e->get_name() == entity_name; });
	}

	std::shared_ptr<Entity> EntityManager::get_entity_by_id(std::string entity_group, std::string entity_id)
	{
		return find_entity(entity_group, [&](const std::shared_ptr<Entity>& e)
			{ return e->get_id() == entity_id; });
	}

	std::shared_ptr<std::vector<std::shared_ptr<Entity>>> EntityManager::find_entities_in_group(std::string entity_group, std::function<bool(std::shared_ptr<Entity>)> predicate)
	{
		auto entity_group_ptr = get_entity_group(entity_group);

		// make a shared pointer to a vector of entities
		auto entities = std::make_shared<std::vector<std::shared_ptr<Entity>>>();

		if (entity_group_ptr != nullptr)
		{
			for (const auto& e : *entity_group_ptr->entities)
			{
				if (predicate(e))
				{
					entities->emplace_back(e);
				}
			}

			return entities;
		}

		return nullptr;
	}

	std::shared_ptr<Entity> EntityManager::find_entity(std::string entity_group, std::function<bool(std::shared_ptr<Entity>)> predicate)
	{
		auto entity_group_ptr = get_entity_group(entity_group);

		if (entity_group_ptr != nullptr)
		{
			auto entity = std::find_if(entity_group_ptr->entities->begin(), entity_group_ptr->entities->end(),
				[&](const std::shared_ptr<Entity>& e)
				{
					return predicate(e);
				});

			if (entity != entity_group_ptr->entities->end())
			{
				return *entity;
			}
		}

		return nullptr;
	}
}

namespace textworld::core
{
	std::unordered_map<std::string, action_func> command_to_actions{
			{"quit", textworld::core::quit_action},
			{"look", textworld::core::look_room_action},
			{"look self", textworld::core::look_self_action},
			{"show", textworld::core::show_item_action},
			{"show all", textworld::core::show_all_items_action},
			{"inspect", textworld::core::show_all_items_action},
			{"take", textworld::core::take_item_action},
			{"take all", textworld::core::take_all_items_action},
			{"drop", textworld::core::drop_item_action},
			{"drop all", textworld::core::drop_all_items_action},
			{"use", textworld::core::use_item_from_inventory_action},
			{"talk to", textworld::core::talk_to_npc},
			{"debug_items", textworld::helpers::debug_items} };

	void quit_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
#ifdef CONSOLE
		auto quit_component = std::make_shared<textworld::components::QuitComponent>("quit",
			[]()
			{
				fmt::print("quitting...\n");
				exit(0);
			});
		player_entity->add_component(quit_component);
#endif
	}

	void show_item_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto room_entity = textworld::helpers::get_players_current_room(player_entity, entity_manager);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");
		auto item_entities = entity_manager->get_entities_in_group("items");

		if (room_entity != nullptr && output_entity != nullptr && item_entities != nullptr)
		{
			auto command_action_component = player_entity->find_first_component_by_type<textworld::components::CommandActionComponent>();

			if (command_action_component != nullptr)
			{
				auto item_entity = std::find_if(item_entities->begin(), item_entities->end(),
					[&](std::shared_ptr<textworld::ecs::Entity> entity)
					{
						auto name = entity->get_name();
						to_lower(name);
						return name == command_action_component->get_arguments_as_string();
					});

				if (item_entity != item_entities->end())
				{
					auto item_component = (*item_entity)->find_first_component_by_type<textworld::components::ItemComponent>();
					auto item_drop_components = room_entity->find_components_by_type<textworld::components::ItemDropComponent>();
					auto item = item_component->get_item();

					if (item_drop_components.size() > 0)
					{
						auto item_drop_component = std::find_if(item_drop_components.begin(), item_drop_components.end(),
							[&](std::shared_ptr<textworld::components::ItemDropComponent> component)
							{
								return item->id == component->get_item_id();
							});

						if (item_drop_component != item_drop_components.end())
						{
							std::shared_ptr<textworld::components::ItemDropComponent> i = *item_drop_component;
							auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in room", fmt::format("{} ({}) : {}", i->get_item_name(), i->get_quantity(), item->description), textworld::data::OutputType::REGULAR);
							output_entity->add_component(output_component);
						}
						else
						{
							auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in room", "That item does not exist here", textworld::data::OutputType::REGULAR);
							output_entity->add_component(output_component);
						}
					}
					else
					{
						// we should look in the players inventory as well instead of just the room

						auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in room", "That item does not exist here", textworld::data::OutputType::REGULAR);
						output_entity->add_component(output_component);
					}
				}
				else
				{
					auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in room", "That item does not exist here", textworld::data::OutputType::REGULAR);
					output_entity->add_component(output_component);
				}
			}
		}
	}

	void show_all_items_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto room_entity = textworld::helpers::get_players_current_room(player_entity, entity_manager);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");

		if (room_entity != nullptr && output_entity != nullptr)
		{
			auto item_drop_components = room_entity->find_components_by_type<textworld::components::ItemDropComponent>();

			if (item_drop_components.size() > 0)
			{
				std::vector<std::string> item_descriptions{};

				for (const auto& item_drop_component : item_drop_components)
				{
					auto item_entity = entity_manager->get_entity_by_id("items", item_drop_component->get_item_id());
					auto item_component = item_entity->find_first_component_by_type<textworld::components::ItemComponent>();
					item_descriptions.emplace_back(fmt::format("{} ({}) : {}", item_component->get_item()->name, item_drop_component->get_quantity(), item_component->get_item()->description));
				}

				auto all_item_descriptions = textworld::helpers::join(item_descriptions, "\n");
				auto output_component = std::make_shared<textworld::components::OutputComponent>("output for all items in room", fmt::format("The following items are here:\n{}", all_item_descriptions), textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
			else
			{
				auto output_component = std::make_shared<textworld::components::OutputComponent>("output for all items in room", "There are no items here", textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
		}
	}

	void take_item_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto room_entity = textworld::helpers::get_players_current_room(player_entity, entity_manager);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");
		auto item_entities = entity_manager->get_entities_in_group("items");
		auto command_action_component = player_entity->find_first_component_by_type<textworld::components::CommandActionComponent>();

		if (room_entity != nullptr && output_entity != nullptr && item_entities != nullptr && command_action_component != nullptr)
		{
			auto item_entity = std::find_if(item_entities->begin(), item_entities->end(),
				[&](std::shared_ptr<textworld::ecs::Entity> entity)
				{
					auto name = entity->get_name();
					to_lower(name);
					return name == command_action_component->get_arguments_as_string();
				});

			if (item_entity != item_entities->end())
			{
				auto item_component = (*item_entity)->find_first_component_by_type<textworld::components::ItemComponent>();
				auto item_drop_components = room_entity->find_components_by_type<textworld::components::ItemDropComponent>();

				if (item_drop_components.size() > 0)
				{
					auto item = item_component->get_item();

					auto item_drop_component = std::find_if(item_drop_components.begin(), item_drop_components.end(),
						[&](std::shared_ptr<textworld::components::ItemDropComponent> component)
						{
							return item->id == component->get_item_id();
						});

					if (item_drop_component != item_drop_components.end())
					{
						textworld::helpers::add_item_to_player_inventory(player_entity, entity_manager, room_entity);

						std::shared_ptr<textworld::components::ItemDropComponent> i = *item_drop_component;
						auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item taken", fmt::format("You've taken {}", item_component->get_item()->name), textworld::data::OutputType::REGULAR);
						output_entity->add_component(output_component);
					}
					else
					{
						auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in room", "That item does not exist here", textworld::data::OutputType::REGULAR);
						output_entity->add_component(output_component);
					}
				}
			}
			else
			{
				auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in room", "That item does not exist here", textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
		}
		else
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in room", "That item does not exist here", textworld::data::OutputType::REGULAR);
			output_entity->add_component(output_component);
		}
	}

	void take_all_items_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto room_entity = textworld::helpers::get_players_current_room(player_entity, entity_manager);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");
		auto item_drop_components = room_entity->find_components_by_type<textworld::components::ItemDropComponent>();

		if (room_entity != nullptr && output_entity != nullptr && item_drop_components.size() > 0)
		{
			std::vector<std::string> item_descriptions{};

			for (const auto& item_drop_component : item_drop_components)
			{
				auto item_entity = entity_manager->get_entity_by_id("items", item_drop_component->get_item_id());
				auto item_component = item_entity->find_components_by_type<textworld::components::ItemComponent>().front();

				textworld::helpers::add_item_to_player_inventory(player_entity, entity_manager, room_entity);

				item_descriptions.emplace_back(fmt::format("{} ({}) : {}", item_component->get_item()->name, item_drop_component->get_quantity(), item_component->get_item()->description));
			}

			auto all_item_descriptions = textworld::helpers::join(item_descriptions, "\n");
			auto output_component = std::make_shared<textworld::components::OutputComponent>("output for all items in room", fmt::format("You've taken the following items:\n{}", all_item_descriptions), textworld::data::OutputType::REGULAR);
			output_entity->add_component(output_component);
		}
		else
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in room", "No items exist here", textworld::data::OutputType::REGULAR);
			output_entity->add_component(output_component);
		}
	}

	void drop_item_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto inventory_components = player_entity->find_components_by_type<textworld::components::InventoryComponent>();
		auto room_entity = textworld::helpers::get_players_current_room(player_entity, entity_manager);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");
		auto item_entities = entity_manager->get_entities_in_group("items");
		auto command_action_component = player_entity->find_first_component_by_type<textworld::components::CommandActionComponent>();

		if (room_entity != nullptr && output_entity != nullptr && item_entities != nullptr && command_action_component != nullptr && inventory_components.size() > 0)
		{
			auto item_entity = std::find_if(item_entities->begin(), item_entities->end(),
				[&](std::shared_ptr<textworld::ecs::Entity> entity)
				{
					auto name = entity->get_name();
					to_lower(name);
					return name == command_action_component->get_arguments_as_string();
				});

			if (item_entity != item_entities->end())
			{
				auto item_component = (*item_entity)->find_first_component_by_type<textworld::components::ItemComponent>();
				auto item = item_component->get_item();
				auto inventory_component = inventory_components.front();
				auto found_item_in_inventory = inventory_component->get_item(item->id);
				auto item_drop_components = room_entity->find_components_by_type<textworld::components::ItemDropComponent>();

				if (found_item_in_inventory != nullptr && item != nullptr)
				{
					auto item_found_in_room = std::find_if(item_drop_components.begin(), item_drop_components.end(),
						[&](std::shared_ptr<textworld::components::ItemDropComponent> component)
						{
							return component->get_item_name() == item_component->get_item()->name;
						});

					if (item_found_in_room != item_drop_components.end())
					{
						(*item_found_in_room)->set_quantity(found_item_in_inventory->quantity);
					}
					else
					{
						auto item_drop_component = std::make_shared<textworld::components::ItemDropComponent>(
							"item drop component for new item in room",
							item_component->get_item()->id,
							item_component->get_item()->name,
							found_item_in_inventory->quantity);
						room_entity->add_component(item_drop_component);
					}

					inventory_component->remove_item(item->id);
					auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item dropped", fmt::format("You've dropped {}", item->name), textworld::data::OutputType::REGULAR);
					output_entity->add_component(output_component);
				}
				else
				{
					auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in inventory", "That item is not in your inventory", textworld::data::OutputType::REGULAR);
					output_entity->add_component(output_component);
				}
			}
			else
			{
				auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in inventory", "That item is not in your inventory", textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
		}
		else
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in inventory", "That item is not in your inventory", textworld::data::OutputType::REGULAR);
			output_entity->add_component(output_component);
		}
	}

	void drop_all_items_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto inventory_components = player_entity->find_components_by_type<textworld::components::InventoryComponent>();
		auto room_entity = textworld::helpers::get_players_current_room(player_entity, entity_manager);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");

		if (room_entity != nullptr && output_entity != nullptr && inventory_components.size() > 0)
		{
			auto inventory_component = inventory_components.front();
			auto item_drop_components = room_entity->find_components_by_type<textworld::components::ItemDropComponent>();

			if (item_drop_components.size() > 0)
			{
				for (const auto& item_drop_component : item_drop_components)
				{
					auto found_item_in_room = inventory_component->get_item(item_drop_component->get_item_id());

					if (found_item_in_room != nullptr)
					{
						item_drop_component->set_quantity(found_item_in_room->quantity);
						inventory_component->remove_item(item_drop_component->get_item_id());
					}
					else
					{
						auto room_item_drop_component = std::make_shared<textworld::components::ItemDropComponent>(
							"item drop component for new item in room",
							item_drop_component->get_item_name(),
							item_drop_component->get_item_id(),
							item_drop_component->get_quantity());
						room_entity->add_component(room_item_drop_component);
					}
				}

				inventory_component->clear_items();
				auto output_component = std::make_shared<textworld::components::OutputComponent>("output for items dropped", "You've dropped all items", textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
			else
			{
				auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in inventory", "You have no items to drop", textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
		}
		else
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in inventory", "You have no items to drop", textworld::data::OutputType::REGULAR);
			output_entity->add_component(output_component);
		}
	}

	void use_item_from_inventory_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto inventory_component = player_entity->find_first_component_by_type<textworld::components::InventoryComponent>();
		auto output_entity = entity_manager->get_entity_by_name("core", "output");
		auto item_entities = entity_manager->get_entities_in_group("items");
		auto command_action_component = player_entity->find_first_component_by_type<textworld::components::CommandActionComponent>();

		if (output_entity != nullptr && item_entities != nullptr && command_action_component != nullptr && inventory_component != nullptr)
		{
			auto item_entity = std::find_if(item_entities->begin(), item_entities->end(),
				[&](std::shared_ptr<textworld::ecs::Entity> entity)
				{
					auto name = entity->get_name();
					to_lower(name);
					return name == command_action_component->get_arguments_as_string();
				});

			if (item_entity != item_entities->end())
			{
				auto item_component = (*item_entity)->find_first_component_by_type<textworld::components::ItemComponent>();
				auto found_item_in_inventory = inventory_component->get_item(item_component->get_item()->id);

				if (found_item_in_inventory != nullptr)
				{
					if (item_entity != item_entities->end())
					{
						auto item = item_component->get_item();

						if (item != nullptr)
						{
							auto actions = item->actions;
							auto found_default_action = item->actions.find("default");

							auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item used", fmt::format("You've used {}", found_item_in_inventory->name), textworld::data::OutputType::REGULAR);
							output_entity->add_component(output_component);

							if (found_default_action != item->actions.end())
							{
								found_default_action->second(player_entity, entity_manager);
							}

							if (item->consumable)
							{
								textworld::helpers::remove_or_decrement_item_in_inventory(player_entity, found_item_in_inventory);
							}
						}
					}
				}
				else
				{
					auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in inventory", "You don't have that item", textworld::data::OutputType::REGULAR);
					output_entity->add_component(output_component);
				}
			}
			else
			{
				auto output_component = std::make_shared<textworld::components::OutputComponent>("output for item in inventory", "You don't have that item", textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
		}
	}

	void look_self_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto show_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show description component", player_entity, textworld::data::DescriptionType::SELF);
		player_entity->add_component(show_description_component);
	}

	void look_room_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto current_room_entity = textworld::helpers::get_players_current_room(player_entity, entity_manager);

		if (current_room_entity != nullptr)
		{
			auto show_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show room description component", current_room_entity, textworld::data::DescriptionType::ROOM);
			player_entity->add_component(show_description_component);

			auto room_exits = current_room_entity->find_components_by_type<textworld::components::ExitComponent>();

			if (room_exits.size() > 0)
			{
				player_entity->add_component(std::make_shared<textworld::components::ShowDescriptionComponent>("show NPCs in current room", player_entity, textworld::data::DescriptionType::NPC));
				player_entity->add_component(textworld::helpers::get_room_exits(entity_manager, current_room_entity));
			}
		}
	}

	void talk_to_npc(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");
		auto npc_entities = entity_manager->get_entities_in_group(textworld::ecs::EntityGroupName::NPCS);

		auto command_action_component = player_entity->find_first_component_by_type<textworld::components::CommandActionComponent>();

		if (command_action_component != nullptr)
		{
			auto command_arguments = command_action_component->get_arguments();
			command_arguments.erase(command_arguments.begin());

			auto npc_name = get_vector_of_strings_as_strings(command_arguments);
			auto npc_entity = entity_manager->find_entity(textworld::ecs::EntityGroupName::NPCS, [&](std::shared_ptr<textworld::ecs::Entity> entity)
				{
					auto name = entity->get_name();
					to_lower(name);

					if (name == npc_name) return true;

					return false; });

			if (npc_entity != nullptr)
			{
				auto output_component = std::make_shared<textworld::components::OutputComponent>("output for talk to npc", fmt::format("I'd talk to {}, but this feature is not fully implemented.", npc_name), textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
			else
			{
				auto output_component = std::make_shared<textworld::components::OutputComponent>("output for talk to npc", "There is noone here to talk to...", textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
		}
	}

	textworld::data::Direction get_opposite_direction(textworld::data::Direction dir)
	{
		switch (dir)
		{
		case textworld::data::Direction::NORTH:
			return textworld::data::Direction::SOUTH;
		case textworld::data::Direction::SOUTH:
			return textworld::data::Direction::NORTH;
		case textworld::data::Direction::EAST:
			return textworld::data::Direction::WEST;
		case textworld::data::Direction::WEST:
			return textworld::data::Direction::EAST;
		case textworld::data::Direction::UP:
			return textworld::data::Direction::DOWN;
		case textworld::data::Direction::DOWN:
			return textworld::data::Direction::UP;
		case textworld::data::Direction::NORTHEAST:
			return textworld::data::Direction::SOUTHWEST;
		case textworld::data::Direction::NORTHWEST:
			return textworld::data::Direction::SOUTHEAST;
		case textworld::data::Direction::SOUTHEAST:
			return textworld::data::Direction::NORTHWEST;
		case textworld::data::Direction::SOUTHWEST:
			return textworld::data::Direction::NORTHEAST;
		case textworld::data::Direction::LEFT:
			return textworld::data::Direction::RIGHT;
		case textworld::data::Direction::RIGHT:
			return textworld::data::Direction::LEFT;
		default:
			return textworld::data::Direction::UNKNOWN;
		};
	}
}

namespace textworld::systems
{
	void command_action_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto flag_component = player_entity->find_first_component_by_type<textworld::components::FlagComponent>();
		if (flag_component != nullptr && flag_component->is_set(textworld::data::Flag::COMMAND_ACTION_SYSTEM_BYPASS))
			return;

		auto command_components = player_entity->find_components_by_type<textworld::components::CommandInputComponent>();

		if (command_components.size() == 0)
			return;

		auto command_set_component = player_entity->find_first_component_by_type<textworld::components::CommandSetComponent>();

		if (command_set_component == nullptr)
			return;

		for (const auto& command_component : command_components)
		{
			textworld::core::action_func command_action =
				textworld::helpers::find_value_in_map<textworld::core::action_func>(command_set_component->get_command_set(), command_component->get_command_with_arguments(), command_component->get_tokens());

			if (command_action != nullptr)
			{
				auto command_action_component = std::make_shared<textworld::components::CommandActionComponent>("command action", command_component->get_command_with_arguments(), command_action);
				player_entity->add_component(command_action_component);
			}

			auto command_action_components = player_entity->find_components_by_type<textworld::components::CommandActionComponent>();

			if (command_action_components.size() > 0)
			{
				for (const auto& ca : command_action_components)
				{
					auto found_action = false;

					if (ca->get_command() == command_component->get_command_with_arguments())
					{
						found_action = true;
					}
					else if (ca->get_command() == command_component->get_command())
					{
						found_action = true;
					}

					if (found_action)
					{
						ca->run_action(player_entity, command_component->get_command(), command_component->get_arguments(), entity_manager);

						player_entity->remove_components(command_components);
						player_entity->remove_components(command_action_components);
					}
				}
			}
		}
	}

	void room_movement_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto flag_component = player_entity->find_first_component_by_type<textworld::components::FlagComponent>();
		if (flag_component != nullptr && flag_component->is_set(textworld::data::Flag::ROOM_MOVEMENT_SYSTEM_BYPASS))
			return;

		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");

		if (player_entity != nullptr)
		{
			auto processed_components = std::vector<std::shared_ptr<textworld::ecs::Component>>{};

			auto command_components = player_entity->find_components_by_type<textworld::components::CommandInputComponent>();

			for (const auto& cc : command_components)
			{
				auto current_room_entity = textworld::helpers::get_players_current_room(player_entity, entity_manager);
				auto exits = current_room_entity->find_components_by_type<textworld::components::ExitComponent>();
				auto exit = std::find_if(exits.begin(), exits.end(), [&](const std::shared_ptr<textworld::components::ExitComponent>& e)
					{ return e->get_direction_as_string() == cc->get_command(); });

				auto upper_case_command = std::string{ cc->get_command() };
				to_upper(upper_case_command);

				auto command_as_direction = magic_enum::enum_cast<textworld::data::Direction>(upper_case_command);

				if (command_as_direction.has_value())
				{
					processed_components.emplace_back(cc);

					if (exit != exits.end())
					{
						auto new_room_entity = entity_manager->get_entity_by_id("rooms", (*exit)->get_room_id());

						if (new_room_entity != nullptr)
						{
							auto room_id_components = player_entity->find_components_by_type<textworld::components::IdComponent>([](std::shared_ptr<textworld::components::IdComponent> id_component)
								{ return id_component->get_id_type() == textworld::data::IdType::CURRENT_ROOM; });

							if (room_id_components.size() > 0)
							{
								room_id_components[0]->set_target_id(new_room_entity->get_id());

								auto show_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show_description", new_room_entity, textworld::data::DescriptionType::ROOM);
								player_entity->add_component(show_description_component);
								player_entity->add_component(std::make_shared<textworld::components::ShowDescriptionComponent>("show NPCs in current room", player_entity, textworld::data::DescriptionType::NPC));
								player_entity->add_component(textworld::helpers::get_room_exits(entity_manager, new_room_entity));
							}
						}
					}
					else
					{
						auto output_component = std::make_shared<textworld::components::OutputComponent>("output", "I cannot go in that direction", textworld::data::OutputType::REGULAR);
						output_entity->add_component(output_component);
					}
				}
			}

			if (processed_components.size() > 0)
				player_entity->remove_components(processed_components);
		}
	}

	void unknown_command_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");
		auto command_components = player_entity->find_components_by_type<textworld::components::CommandInputComponent>();
		std::vector<std::shared_ptr<textworld::components::UnknownCommandComponent>> unknown_command_components;

		for (const auto& cc : command_components)
		{
			auto unknown_command_component = std::make_shared<textworld::components::UnknownCommandComponent>("unknown_command", cc->get_command());
			unknown_command_components.emplace_back(unknown_command_component);
		}

		if (command_components.size() > 0)
			player_entity->remove_components(command_components);

		if (unknown_command_components.size() > 0)
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("output", "I don't know how to do that", textworld::data::OutputType::REGULAR);
			output_entity->add_component(output_component);
		}
	}

	void description_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto flag_component = player_entity->find_first_component_by_type<textworld::components::FlagComponent>();
		if (flag_component != nullptr && flag_component->is_set(textworld::data::Flag::DESCRIPTION_SYSTEM_BYPASS))
			return;

		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");
		auto room_entities = entity_manager->get_entities_in_group(textworld::ecs::EntityGroupName::ROOMS);

		auto players_current_room = textworld::helpers::get_players_current_room(player_entity, entity_manager);

		std::vector<std::shared_ptr<textworld::ecs::Component>> processed_components{};

		if (player_entity != nullptr)
		{
			auto show_description_components = player_entity->find_components_by_type<textworld::components::ShowDescriptionComponent>();
			processed_components.insert(processed_components.end(), show_description_components.begin(), show_description_components.end());

			for (const auto& sc : show_description_components)
			{
				processed_components.emplace_back(sc);

				if (sc->get_entity() != nullptr)
				{
					auto description_component = sc->get_entity()->find_first_component_by_type<textworld::components::DescriptionComponent>();

					if (description_component != nullptr)
					{
						if (sc->get_description_type() == textworld::data::DescriptionType::ROOM)
						{
							auto output_component = std::make_shared<textworld::components::OutputComponent>("output", description_component->get_description(), textworld::data::OutputType::REGULAR);
							output_entity->add_component(output_component);
						}
						else if (sc->get_description_type() == textworld::data::DescriptionType::SELF)
						{
							auto output_component = std::make_shared<textworld::components::OutputComponent>("output",
								fmt::format("looking intently at yourself: {}", description_component->get_description()), textworld::data::OutputType::REGULAR);
							output_entity->add_component(output_component);
						}
						else if (sc->get_description_type() == textworld::data::DescriptionType::NPC)
						{
							auto npcs = textworld::helpers::get_npcs_in_room(players_current_room->get_id(), entity_manager);

							if (npcs != nullptr)
							{
								std::vector<std::string> names{};
								for (const auto& npc : *npcs)
								{
									names.emplace_back(npc->get_name());
								}

								if (names.size() > 0)
								{
									std::ostringstream oss;
									std::copy(names.begin(), names.end() - 1, std::ostream_iterator<std::string>(oss, ", "));
									oss << names.back();

									auto output_component = std::make_shared<textworld::components::OutputComponent>("output", fmt::format("The following NPCs are here: {}", oss.str()), textworld::data::OutputType::REGULAR);
									output_entity->add_component(output_component);
								}
							}
						}
					}
				}
				else if (sc->get_description_type() == textworld::data::DescriptionType::EXIT)
				{
					auto output_component = std::make_shared<textworld::components::OutputComponent>("exit description output", sc->get_name(), textworld::data::OutputType::REGULAR);
					output_entity->add_component(output_component);
				}
			}

			if (processed_components.size() > 0)
				player_entity->remove_components(processed_components);
		}
	}

	void quit_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto quit_components = player_entity->find_components_by_type<textworld::components::QuitComponent>();

		if (quit_components.size() > 0)
		{
			player_entity->remove_components(quit_components);
			quit_components.front()->run_action();
		}
	}

	void motd_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");

		auto motd_description_component = player_entity->find_first_component_by_name<textworld::components::DescriptionComponent>("motd");

		if (motd_description_component != nullptr)
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("motd output for description", motd_description_component->get_description(), textworld::data::OutputType::MESSAGE_OF_THE_DAY);
			output_entity->add_component(output_component);
			player_entity->remove_component(motd_description_component);
		}
	}

	void console_output_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");

		if (output_entity != nullptr)
		{
			auto output_components = output_entity->find_components_by_type<textworld::components::OutputComponent>();

			for (const auto& output_component : output_components)
			{
				if (output_component->get_output_type() == textworld::data::OutputType::REGULAR)
				{
					fmt::print("{}\n\n", output_component->get_value());
				}
				/*else if (output_component->get_output_type() == textworld::data::OutputType::COMMAND)
				{
					fmt::print("command: {}\n\n", output_component->get_value());
				}*/
				else if (output_component->get_output_type() == textworld::data::OutputType::SEPARATOR)
				{
					fmt::print("\n");
				}
				else if (output_component->get_output_type() == textworld::data::OutputType::MESSAGE_OF_THE_DAY)
				{
					fmt::print("-[ {} ]-\n\n", output_component->get_value());
				}
			}

			output_entity->clear_components();
		}
	}

	void console_input_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");

		auto health_component = player_entity->find_first_component_by_name<textworld::components::ValueComponent<int>>("health");
		auto gold_component = player_entity->find_first_component_by_name<textworld::components::ValueComponent<int>>("gold");

		if (health_component != nullptr && gold_component != nullptr)
		{
			fmt::print("H{}:G{}> ", health_component->get_value(), gold_component->get_value());
		}
		else
		{
			fmt::print("> ");
		}

		std::string command;
		std::getline(std::cin, command);

		if (command != "")
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("command output", command, textworld::data::OutputType::COMMAND);
			auto command_component = std::make_shared<textworld::components::CommandInputComponent>("command", command);
			player_entity->add_component(command_component);
			output_entity->add_component(output_component);
		}
	}

	void inventory_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto flag_component = player_entity->find_first_component_by_type<textworld::components::FlagComponent>();
		if (flag_component != nullptr && flag_component->is_set(textworld::data::Flag::INVENTORY_SYSTEM_BYPASS))
			return;

		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");

		std::vector<std::shared_ptr<textworld::ecs::Component>> processed_components{};

		auto command_components = player_entity->find_components_by_type<textworld::components::CommandInputComponent>();

		for (const auto& command_component : command_components)
		{
			auto command = command_component->get_command();

			if (command == "inv" || command == "inventory")
			{
				processed_components.emplace_back(command_component);

				auto inventory_components = player_entity->find_components_by_type<textworld::components::InventoryComponent>();

				if (inventory_components.size() > 0)
				{
					auto inventory_component = &inventory_components.front();
					auto items_string = (*inventory_component)->get_items_string();

					if (items_string != "")
					{
						auto output_component = std::make_shared<textworld::components::OutputComponent>("inventory output", fmt::format("inventory:\n{}", items_string), textworld::data::OutputType::REGULAR);
						output_entity->add_component(output_component);
					}
					else
					{
						auto output_component = std::make_shared<textworld::components::OutputComponent>("inventory output", "You are not carrying anything.", textworld::data::OutputType::REGULAR);
						output_entity->add_component(output_component);
					}
				}
			}
		}

		if (processed_components.size() > 0)
			player_entity->remove_components(processed_components);
	}

	void npc_dialog_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto flag_component = player_entity->find_first_component_by_type<textworld::components::FlagComponent>();
		if (flag_component != nullptr && flag_component->is_set(textworld::data::Flag::NPC_DIALOG_SYSTEM_BYPASS))
			return;

		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");
		auto command_component = player_entity->find_first_component_by_type<textworld::components::CommandInputComponent>();
		auto players_current_room = textworld::helpers::get_players_current_room(player_entity, entity_manager);
		auto npcs = textworld::helpers::get_npcs_in_room(players_current_room->get_id(), entity_manager);

		if (npcs != nullptr && command_component != nullptr)
		{
			auto command = command_component->get_command();

			if (command == "talk")
			{
				auto output_component = std::make_shared<textworld::components::OutputComponent>("npc dialog output", "I'd talk to an NPC if one were here...", textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);

				player_entity->remove_component(command_component);
			}
		}
	}

	void question_response_sequence_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto flag_component = player_entity->find_first_component_by_type<textworld::components::FlagComponent>();
		if (flag_component != nullptr && flag_component->is_set(textworld::data::Flag::QUESTION_RESPONSE_SEQUENCE_SYSTEM_BYPASS))
			return;

		auto output_entity = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::CORE, "output");
		auto question_response_sequence_component = player_entity->find_first_component_by_type<textworld::components::QuestionResponseSequenceComponent>();

		if (question_response_sequence_component != nullptr)
		{
			if (!question_response_sequence_component->get_waiting_for_answer() &&
				(question_response_sequence_component->get_question_count() >=
					question_response_sequence_component->get_response_count()))
			{
				question_response_sequence_component->set_waiting_for_answer(true);
				auto question = question_response_sequence_component->get_question(question_response_sequence_component->get_response_count());
				auto output_component = std::make_shared<textworld::components::OutputComponent>("question response sequence output", question, textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);
			}
			else
			{
				auto command_component = player_entity->find_first_component_by_type<textworld::components::CommandInputComponent>();
				if (command_component != nullptr)
				{
					question_response_sequence_component->set_waiting_for_answer(false);
					question_response_sequence_component->add_response(command_component->get_command_with_arguments());
					auto output_component = std::make_shared<textworld::components::OutputComponent>("question response sequence output",
						fmt::format("You answered with: {}", question_response_sequence_component->get_response(question_response_sequence_component->get_response_count() - 1)),
						textworld::data::OutputType::REGULAR);
					output_entity->add_component(output_component);
				}
			}
		}
	}

	void combat_system(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		// TODO: Implement combat system.
	}
}

#ifdef SDL2
namespace textworld::gfx
{
	int get_neighbor_wall_count(std::shared_ptr<boost::numeric::ublas::matrix<int>> map, int map_width, int map_height, int x, int y)
	{
		int wall_count = 0;

		for (int row = y - 1; row <= y + 1; row++)
		{
			for (int col = x - 1; col <= x + 1; col++)
			{
				if (row >= 1 && col >= 1 && row < map_height - 1 && col < map_width - 1)
				{
					if ((*map)(row, col) == 0)
						wall_count++;
				}
				else
				{
					wall_count++;
				}
			}
		}

		return wall_count;
	}

	void perform_cellular_automaton(std::shared_ptr<boost::numeric::ublas::matrix<int>> map, int map_width, int map_height, int passes)
	{
		for (int p = 0; p < passes; p++)
		{
			auto& temp_map = std::make_shared<boost::numeric::ublas::matrix<int>>() = map;

			for (int rows = 0; rows < map_height; rows++)
			{
				for (int columns = 0; columns < map_width; columns++)
				{
					auto neighbor_wall_count = get_neighbor_wall_count(temp_map, map_width, map_height, columns, rows);

					if (neighbor_wall_count > 4)
						(*map)(rows, columns) = 0;
					else
						(*map)(rows, columns) = 9;
				}
			}
		}
	}

	std::shared_ptr<boost::numeric::ublas::matrix<int>> init_cellular_automata(int map_width, int map_height)
	{
		auto map = std::make_shared<boost::numeric::ublas::matrix<int>>(map_height, map_width);

		for (int r = 0; r < map_height; ++r)
		{
			for (int c = 0; c < map_width; ++c)
			{
				auto z = std::rand() % 100 + 1;
				if (z > 48)
					(*map)(r, c) = 9;
				else
					(*map)(r, c) = 0;
			}
		}

		return map;
	}

	std::shared_ptr<std::queue<Point>> AStarPathFinder::find_path(Point start, Point end, int walkable_tile_id)
	{
		AStarNode none{};
		auto path = std::make_shared<std::queue<Point>>();
		auto start_node = std::make_shared<AStarNode>(none, start);
		auto end_node = std::make_shared<AStarNode>(none, end);
		auto open_list = std::make_shared<std::vector<std::shared_ptr<AStarNode>>>();
		auto closed_list = std::make_shared<std::vector<std::shared_ptr<AStarNode>>>();

		open_list->emplace_back(start_node);

		while (open_list->size() > 0)
		{
			auto current_node = open_list->front();
			int current_index = 0;

			int _index = 0;
			for (const auto& item : *open_list)
			{
				if (item->f < current_node->f)
				{
					current_node = item;
					current_index = _index;
				}
				_index++;
			}

			open_list->erase(open_list->begin() + current_index);
			closed_list->emplace_back(current_node);

			if (current_node->eq(*end_node))
			{
				auto& current = current_node;
				while (current != nullptr && current->position != nullptr)
				{
					Point path_point = { current->position->x, current->position->y };
					path->push(path_point);
					current = current->parent;
				}

				return path;
			}

			auto children = std::make_shared<std::vector<std::shared_ptr<AStarNode>>>();

			for (const auto& new_position : pos_array)
			{
				auto node_position = std::make_shared<Point>(current_node->position->x + new_position.x, current_node->position->y + new_position.y);

				if (node_position->x > (map->size2() - 1) || node_position->x < 0 ||
					node_position->y >(map->size1() - 1) || node_position->y < 0)
					continue;

				if ((*map)(node_position->y, node_position->x) != walkable_tile_id)
					continue;

				auto child = std::make_shared<AStarNode>(*current_node, *node_position);
				children->emplace_back(child);
			}

			for (const auto& child : *children)
			{
				auto closed_list_result = std::find_if(closed_list->begin(), closed_list->end(),
					[&](const std::shared_ptr<AStarNode>& c)
					{
						return c->eq(*child);
					});

				if (closed_list_result != closed_list->end() && *closed_list_result != nullptr)
					continue;

				child->g = current_node->g + 1;
				child->h = (int)pow(child->position->x - end_node->position->x, 2) + (int)pow(child->position->y - end_node->position->y, 2);
				child->f = child->g + child->h;

				auto open_node_result = std::find_if(open_list->begin(), open_list->end(),
					[&](const std::shared_ptr<AStarNode>& o)
					{
						return child->eq(*o) && child->g >= o->g;
					});

				if (open_node_result != open_list->end() && *open_node_result != nullptr)
					continue;

				open_list->emplace_back(child);
			}
		}

		return path;
	}

	SpriteSheet::SpriteSheet(SDL_Renderer* renderer, std::string name, std::string path, int sprite_width, int sprite_height)
		: renderer(renderer), name(name), path(path), sprite_width(sprite_width), sprite_height(sprite_height)
	{
		auto tileset = IMG_Load(path.c_str());
		auto t_color = SDL_MapRGB(tileset->format, 0, 0, 0);
		SDL_SetColorKey(tileset, SDL_TRUE, t_color);
		spritesheet_texture = SDL_CreateTextureFromSurface(renderer, tileset);
		int total_sprites_on_sheet = tileset->w / sprite_width * tileset->h / sprite_height;
		sprites = std::make_unique<std::vector<std::shared_ptr<SDL_Rect>>>(0);

		for (int y = 0; y < total_sprites_on_sheet / (sprite_height / 2); y++)
		{
			for (int x = 0; x < total_sprites_on_sheet / (sprite_width / 2); x++)
			{
				SDL_Rect rect = { x * sprite_width, y * sprite_height, sprite_width, sprite_height };
				auto r = std::make_shared<SDL_Rect>(rect);
				sprites->emplace_back(r);
			}
		}

		SDL_FreeSurface(tileset);
	}

	void SpriteSheet::draw_sprite(int sprite_id, int x, int y, int scaled_width, int scaled_height)
	{
		if (sprite_id < 0 || sprite_id > sprites->size())
			return;

		SDL_Rect dest = {
				x,
				y,
				(scaled_width > 0) ? scaled_width : sprite_width,
				(scaled_height > 0) ? scaled_height : sprite_height };
		auto& sprite_rect = sprites->at(sprite_id);
		SDL_RenderCopy(renderer, spritesheet_texture, &(*sprite_rect), &dest);
	}

	sol::table SpriteSheet::get_sprites_as_lua_table(sol::this_state s)
	{
		sol::state_view lua(s);
		sol::table sprites_table = lua.create_table();

		for (std::size_t i = 0, sp = sprites->size(); i != sp; ++i)
		{
			auto& sprite_rect = sprites->at(i);
			sol::table rect_table = lua.create_table();

			rect_table.set("x", sprite_rect->x);
			rect_table.set("y", sprite_rect->y);
			rect_table.set("w", sprite_rect->w);
			rect_table.set("h", sprite_rect->h);

			sprites_table.set(i, rect_table);
		}

		return sprites_table;
	}

	void Engine::init(std::string title, int width, int height, bool fullscreen)
	{
		if (SDL_Init(SDL_INIT_EVERYTHING) != 0)
			throw std::runtime_error(std::string("SDL_Init Error: ") + SDL_GetError());

		if (TTF_Init() != 0)
			throw std::runtime_error(std::string("TTF_Init Error: ") + TTF_GetError());

		if (IMG_Init(IMG_INIT_PNG) < 0)
			throw std::runtime_error(std::string("IMG_Init Error: ") + IMG_GetError());

		if (Mix_Init(MIX_INIT_MP3) == 0)
			throw std::runtime_error(std::string("Mix_Init Error: ") + Mix_GetError());

		if (Mix_OpenAudio(44100, MIX_DEFAULT_FORMAT, 2, 2048) != 0)
			throw std::runtime_error(std::string("Mix_OpenAudio Error: ") + Mix_GetError());

		if (Mix_AllocateChannels(32) != 32)
			throw std::runtime_error(std::string("Mix_AllocateChannels Error: ") + Mix_GetError());

		if (Mix_Volume(-1, MIX_MAX_VOLUME) != MIX_MAX_VOLUME)
			throw std::runtime_error(std::string("Mix_Volume Error: ") + Mix_GetError());

		if (Mix_VolumeMusic(MIX_MAX_VOLUME) != MIX_MAX_VOLUME)
			throw std::runtime_error(std::string("Mix_VolumeMusic Error: ") + Mix_GetError());

		Uint32 flags = SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC;

		if (fullscreen)
			flags |= SDL_WINDOW_FULLSCREEN;

		window = SDL_CreateWindow(
			title.c_str(),
			SDL_WINDOWPOS_CENTERED,
			SDL_WINDOWPOS_CENTERED,
			width,
			height,
			flags);

		if (window == nullptr)
			throw std::runtime_error(std::string("SDL_CreateWindow Error: ") + SDL_GetError());

		renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_TARGETTEXTURE);
		SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);

		SDL_Surface* window_icon_surface = IMG_Load("assets/icon.png");
		SDL_SetWindowIcon(window, window_icon_surface);
		SDL_FreeSurface(window_icon_surface);

		text = std::make_unique<Text>(renderer, "assets/VT323-Regular.ttf", 32);
		spritesheet_manager = std::make_unique<SpriteSheetManager>(renderer);
	}

	void Engine::game_loop()
	{
		static Timer timer{};
		bool quit = false;
		SDL_Event event;

		int FPS = 60;
		Uint32 elapsed_time = 0;
		int frame_time = 0;

		while (!quit)
		{
			elapsed_time = SDL_GetTicks();

			while (SDL_PollEvent(&event))
			{
				if (event.type == SDL_QUIT)
					quit = true;
				else if (event.type == SDL_KEYDOWN)
				{
					if (event.key.keysym.sym == SDLK_ESCAPE)
						quit = true;
				}
			}

			SDL_RenderClear(renderer);
			render();
			SDL_RenderPresent(renderer);

			frame_time = SDL_GetTicks() - elapsed_time;
			if (frame_time < (1000 / FPS))
			{
				SDL_Delay((1000 / FPS) - frame_time);
				timer.tick();
			}
		}
	}

	void Engine::render()
	{
		draw_text(10, 10, "Hello SDL2 World!");
	}

	void Engine::switch_map(std::string name)
	{
		auto map = std::find_if(maps->begin(), maps->end(),
			[&](const std::shared_ptr<Map>& m)
			{
				return m->name == name;
			});

		if (map != maps->end())
		{
			current_map = *map;
			// path_finder = std::make_unique<AStarPathFinder>(current_map->map);
		}
	}

	void Engine::generate_map(std::string name, int map_width, int map_height)
	{
		auto map = init_cellular_automata(map_width, map_height);
		perform_cellular_automaton(map, map_width, map_height, 10);

		maps->erase(std::remove_if(maps->begin(), maps->end(),
			[&](const auto& m)
			{
				if (m->name == name)
					return true;

				return false;
			}),
			maps->end());

		maps->emplace_back(std::make_shared<Map>(name, map_width, map_height, map));
	}

	std::shared_ptr<Map> Engine::get_map(std::string name)
	{
		auto map = std::find_if(maps->begin(), maps->end(),
			[&](const auto& m)
			{
				return m->name == name;
			});

		if (map != maps->end())
		{
			return *map;
		}

		return nullptr;
	}

	void Engine::play_sound(std::string name)
	{
		if (!(name.length() > 0))
			return;

		auto sound = std::find_if(sounds->begin(), sounds->end(),
			[&](const auto& s)
			{
				return s->name == name;
			});

		if (sound != sounds->end())
		{
			(*sound)->play();
		}
	}

	void Engine::render_graphic(std::string path, int window_width, int x, int y, bool centered, bool scaled, float scaled_factor)
	{
		auto graphic = IMG_Load(path.c_str());
		auto graphic_texture = SDL_CreateTextureFromSurface(renderer, graphic);

		SDL_Rect src = { 0, 0, graphic->w, graphic->h };
		SDL_Rect dest = { x, y, graphic->w, graphic->h };

		if (centered)
			dest = { ((window_width / (2 + (int)scaled_factor)) - (graphic->w / 2)), y, graphic->w, graphic->h };

		if (scaled)
		{
			SDL_RenderSetScale(renderer, scaled_factor, scaled_factor);
			SDL_RenderCopy(renderer, graphic_texture, &src, &dest);
			SDL_RenderSetScale(renderer, 1, 1);
		}
		else
		{
			SDL_RenderCopy(renderer, graphic_texture, &src, &dest);
		}

		SDL_FreeSurface(graphic);
		SDL_DestroyTexture(graphic_texture);
	}

	TileType Engine::get_tile_type(std::string player_id, int x, int y)
	{
		int tile_id = (*current_map->map)((size_t)y, x);

		// auto player_entity = entity_manager->get_entity_by_id(textworld::ecs::EntityGroupName::PLAYERS, player_id);
		// if (player_entity != nullptr)
		// {
		// 	auto player_position = player_entity->find_first_component_by_type<textworld::gfx::PositionComponent>();

		// 	if (player_position != nullptr && player_position->get_x() == x && player_position->get_y() == y)
		// 	{
		// 		return TileType::PLAYER;
		// 	}
		// }

		return TileType::UNKNOWN;
	}

	// Adapted from http://www.roguebasin.com/index.php?title=Eligloscode
	void Engine::rb_fov(Point from_point)
	{
		float x = 0, y = 0;

		current_map->light_map = std::make_shared<boost::numeric::ublas::matrix<int>>(current_map->height, current_map->width, 0);

		for (int i = 0; i < 360; i++)
		{
			x = (float)std::cos(i * 0.01745f);
			y = (float)std::sin(i * 0.01745f);

			float ox = (float)from_point.x + 0.5f;
			float oy = (float)from_point.y + 0.5f;

			for (int j = 0; j < 40; j++)
			{
				(*current_map->light_map)((int)oy, (int)ox) = 2;

				if ((*current_map->map)((int)oy, (int)ox) == 0) // if tile is a wall
					break;

				ox += x;
				oy += y;
			}
		}
	}

}
#endif