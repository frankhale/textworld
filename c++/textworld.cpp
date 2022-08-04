#include "textworld.h"

std::string generate_uuid()
{
	boost::uuids::random_generator gen;
	boost::uuids::uuid id = gen();
	return boost::uuids::to_string(id);
}

namespace textworld::helpers
{
	std::shared_ptr<textworld::ecs::Entity> get_players_current_room(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		if (player_entity != nullptr)
		{
			auto room_id_component = player_entity->find_components_by_type<textworld::components::IdComponent>([](std::shared_ptr<textworld::components::IdComponent> id_component)
				{ return id_component->get_id_type() == textworld::data::IdType::ROOM; });

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

		// if exits is not the end
		if (exits.size() > 0)
		{
			std::vector<std::string> exit_info{};
			std::vector<std::string> exit_ids{};
			std::unordered_map<std::string, std::shared_ptr<textworld::components::ExitComponent>> exit_map{};

			for (const auto& exit : exits)
			{
				exit_ids.push_back(exit->get_room_id());
				exit_map[exit->get_room_id()] = exit;
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
				exit_info.push_back(fmt::format("{} : {}", direction, room_entity->get_name()));
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
		if (first != last) {
			while (true) {
				ss << *first;
				if (++first == last) break;
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

	std::shared_ptr<textworld::data::Item> make_item(std::string name, std::string description, std::unordered_map<std::string, textworld::core::simple_action_func> actions)
	{
		auto i = textworld::data::Item{
			.id = generate_uuid(),
			.name = name,
			.description = description,
			.synonyms = { name },
			.quantity = 1,
			.is_container = false,
			.can_be_destroyed = true,
			.consumable = false,
			.lua_scripted_actions = {},
			.actions = { actions }
		};

		return std::make_shared<textworld::data::Item>(i);
	}

	std::shared_ptr<textworld::data::Item> make_consumable_item(std::string name, std::string description, std::unordered_map<std::string, textworld::core::simple_action_func> actions)
	{
		auto i = textworld::data::Item{
			.id = generate_uuid(),
			.name = name,
			.description = description,
			.synonyms = { name },
			.quantity = 1,
			.is_container = false,
			.can_be_destroyed = true,
			.consumable = true,
			.lua_scripted_actions = {},
			.actions = { actions }
		};

		return std::make_shared<textworld::data::Item>(i);
	}
}

namespace textworld::ecs
{
	std::shared_ptr<EntityGroup> EntityManager::create_entity_group(std::string group_name)
	{
		auto entityGroup = std::make_shared<EntityGroup>();
		entityGroup->name = group_name;
		entityGroup->entities = std::make_shared<std::vector<std::shared_ptr<Entity>>>();
		entity_groups->emplace_back(entityGroup);
		return entityGroup;
	}

	void EntityManager::add_entity_to_group(std::shared_ptr<Entity> e, std::string group_name)
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
					entities->push_back(e);
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
	std::unordered_map<std::string, simple_action_func> command_to_actions{
		{ "quit", textworld::core::quit_action },
		{ "look", textworld::core::look_room_action },
		{ "look self", textworld::core::look_self_action },
		{ "show", textworld::core::show_item_action },
		{ "show all", textworld::core::show_all_items_action },
		{ "inspect", textworld::core::show_all_items_action },
		{ "take", textworld::core::take_item_action },
		{ "take all", textworld::core::take_all_items_action },
		{ "drop", textworld::core::drop_item_action },
		{ "drop all", textworld::core::drop_all_items_action },
		{ "use", textworld::core::use_item_from_inventory_action }
	};

	void quit_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		// FIXME: This assumes we are playing on the console and we eventually want 
		// to make this multiplayer and run from a server.
		fmt::print("quitting...\n");
		exit(0);
	}

	void show_item_action(std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto room_entity = textworld::helpers::get_players_current_room(player_entity, entity_manager);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");
		auto item_entities = entity_manager->get_entities_in_group("items");

		if (room_entity != nullptr && output_entity != nullptr && item_entities != nullptr)
		{
			auto command_action_component = player_entity->find_first_component_by_type<textworld::components::CommandActionComponent>();

			if (command_action_component != nullptr) {
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
					item_descriptions.push_back(fmt::format("{} ({}) : {}", item_component->get_item()->name, item_drop_component->get_quantity(), item_component->get_item()->description));
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

				item_descriptions.push_back(fmt::format("{} ({}) : {}", item_component->get_item()->name, item_drop_component->get_quantity(), item_component->get_item()->description));
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
		default:
			return textworld::data::Direction::EAST;
		};
	}
}

namespace textworld::systems
{
	void command_action_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto player_entity = entity_manager->get_entity_by_id("players", player_id);
		auto command_components = player_entity->find_components_by_type<textworld::components::CommandInputComponent>();

		for (const auto& command_component : command_components)
		{
			std::unordered_map<std::string, textworld::core::simple_action_func>::const_iterator command_actions_long_it = textworld::core::command_to_actions.find(command_component->get_command_with_arguments());
			std::unordered_map<std::string, textworld::core::simple_action_func>::const_iterator command_actions_short_it = textworld::core::command_to_actions.find(command_component->get_command());

			textworld::core::simple_action_func command_action;

			if (command_actions_long_it != textworld::core::command_to_actions.end())
			{
				command_action = command_actions_long_it->second;
			}
			else if (command_actions_short_it != textworld::core::command_to_actions.end())
			{
				command_action = command_actions_short_it->second;
			}

			if (command_action != nullptr)
			{
				auto command_action_component = std::make_shared<textworld::components::CommandActionComponent>
					("command action", command_component->get_command_with_arguments(), command_action);
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

	void room_movement_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto player_entity = entity_manager->get_entity_by_id("players", player_id);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");

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

				if (command_as_direction.has_value()) {
					processed_components.push_back(cc);

					if (exit != exits.end())
					{
						auto new_room_entity = entity_manager->get_entity_by_id("rooms", (*exit)->get_room_id());

						if (new_room_entity != nullptr)
						{
							auto room_id_components = player_entity->find_components_by_type<textworld::components::IdComponent>([](std::shared_ptr<textworld::components::IdComponent> id_component)
								{ return id_component->get_id_type() == textworld::data::IdType::ROOM; });

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

	void unknown_command_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto player_entity = entity_manager->get_entity_by_id("players", player_id);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");
		auto command_components = player_entity->find_components_by_type<textworld::components::CommandInputComponent>();
		std::vector<std::shared_ptr<textworld::components::UnknownCommandComponent>> unknown_command_components;

		for (const auto& cc : command_components)
		{
			auto unknown_command_component = std::make_shared<textworld::components::UnknownCommandComponent>("unknown_command", cc->get_command());
			unknown_command_components.push_back(unknown_command_component);
		}

		if (command_components.size() > 0)
			player_entity->remove_components(command_components);

		if (unknown_command_components.size() > 0)
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("output", "I don't know how to do that", textworld::data::OutputType::REGULAR);
			output_entity->add_component(output_component);
		}
	}

	void description_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto player_entity = entity_manager->get_entity_by_id("players", player_id);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");
		auto room_entities = entity_manager->get_entities_in_group("rooms");

		auto players_current_room = textworld::helpers::get_players_current_room(player_entity, entity_manager);

		std::vector<std::shared_ptr<textworld::ecs::Component>> processed_components{};

		if (player_entity != nullptr)
		{
			auto show_description_components = player_entity->find_components_by_type<textworld::components::ShowDescriptionComponent>();
			processed_components.insert(processed_components.end(), show_description_components.begin(), show_description_components.end());

			for (const auto& sc : show_description_components)
			{
				processed_components.push_back(sc);

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
							auto npcs = entity_manager->get_entities_in_group(textworld::ecs::EntityGroupName::NPCS);

							if (npcs->size() > 0)
							{
								std::vector<std::string> names{};
								for (const auto& npc : *npcs)
								{
									auto room_id_component = npc->find_first_component_by_type<textworld::components::IdComponent>();
									if (room_id_component != nullptr && 
											room_id_component->get_id_type() == textworld::data::IdType::ROOM &&
											room_id_component->get_target_id() == players_current_room->get_id())
									{
										names.push_back(npc->get_name());
									}
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

	void quit_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto player_entity = entity_manager->get_entity_by_id("players", player_id);
		auto quit_components = player_entity->find_components_by_type<textworld::components::QuitComponent>();

		if (quit_components.size() > 0)
		{
			quit_components.front()->run_action();
			player_entity->remove_components(quit_components);
		}
	}

	void motd_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto player_entity = entity_manager->get_entity_by_id("players", player_id);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");

		auto motd_description_component = player_entity->find_first_component_by_name<textworld::components::DescriptionComponent>("motd");

		if (motd_description_component != nullptr)
		{
			auto output_component = std::make_shared<textworld::components::OutputComponent>("motd output for description", motd_description_component->get_description(), textworld::data::OutputType::MESSAGEOFTHEDAY);
			output_entity->add_component(output_component);
			player_entity->remove_component(motd_description_component);
		}
	}

	void console_output_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto output_entity = entity_manager->get_entity_by_name("core", "output");

		if (output_entity != nullptr)
		{
			// find output components on the output entity
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
				else if (output_component->get_output_type() == textworld::data::OutputType::MESSAGEOFTHEDAY)
				{
					fmt::print("-[ {} ]-\n\n", output_component->get_value());
				}
			}

			output_entity->clear_components();
		}
	}

	void console_input_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto player_entity = entity_manager->get_entity_by_id("players", player_id);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");

		auto health_component = player_entity->find_first_component_by_name<textworld::components::ValueComponent<int>>("health");
		auto gold_component = player_entity->find_first_component_by_name<textworld::components::ValueComponent<int>>("gold");

		if (health_component != nullptr && gold_component != nullptr)
		{
			fmt::print("H{}:G{} > ", health_component->get_value(), gold_component->get_value());
		}
		else
		{
			fmt::print("> ");
		}

		std::string command;
		std::getline(std::cin, command);

		auto output_component = std::make_shared<textworld::components::OutputComponent>("command output", command, textworld::data::OutputType::COMMAND);
		auto command_component = std::make_shared<textworld::components::CommandInputComponent>("command", command);
		player_entity->add_component(command_component);
		output_entity->add_component(output_component);
	}

	void inventory_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto player_entity = entity_manager->get_entity_by_id("players", player_id);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");

		std::vector<std::shared_ptr<textworld::ecs::Component>> processed_components{};

		auto command_components = player_entity->find_components_by_type<textworld::components::CommandInputComponent>();

		for (const auto& command_component : command_components)
		{
			auto command = command_component->get_command();

			if (command == "inv" || command == "inventory")
			{
				processed_components.push_back(command_component);

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

	void npc_dialog_system(std::string player_id, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		auto player_entity = entity_manager->get_entity_by_id("players", player_id);
		auto output_entity = entity_manager->get_entity_by_name("core", "output");
		auto command_component = player_entity->find_first_component_by_type<textworld::components::CommandInputComponent>();

		if (command_component != nullptr)
		{
			auto command = command_component->get_command_with_arguments();

			if (command == "talk" || command == "converse" || command == "converse with")
			{				
				auto output_component = std::make_shared<textworld::components::OutputComponent>("npc dialog output", "I'd talk to an NPC if one were here...", textworld::data::OutputType::REGULAR);
				output_entity->add_component(output_component);

				player_entity->remove_component(command_component);
			}
		}		
	}
}
