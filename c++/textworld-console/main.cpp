#include "../textworld.h"

int main()
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();

	mk_it("Coin Purse", "An old leather coin purse", [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{
			auto currency_component = player_entity->find_first_component_by_type<textworld::components::CurrencyComponent>();
			if (currency_component != nullptr) {
				currency_component->add(10);
			}
		});
	mk_it("Health Potion", "A common health potion", [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{			
			auto stats_component = player_entity->find_first_component_by_type<textworld::components::StatsComponent>();
			if (stats_component != nullptr) {
				stats_component->add_health(50);
			}
		});
	mk_it("Lamp", "A rusty old oil lamp", [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{			
			auto output_entity = entity_manager->get_entity_by_name("core", "output");
			if (output_entity != nullptr) {				
				auto output_component = std::make_shared<textworld::components::OutputComponent>("lamp used", "The lamp flickers with a tiny flame");				
				output_entity->add_component(output_component);
			}
		});

	begin_room_configuration()
		mk_rm("Test Room 1", "This is a test room 1!!!");
		mk_rm("Test Room 2", "This is a test room 2!!!");
		mk_rm("Test Room 3", "This is a test room 3!!!");

		mk_ex("Test Room 1", "Test Room 2", textworld::data::Direction::EAST);
		mk_ex("Test Room 2", "Test Room 3", textworld::data::Direction::NORTH);

		pl_it("Test Room 1", "Coin Purse", 1);
		pl_it("Test Room 1", "Health Potion", 3);
	end_room_configuration()

	//for (const auto& r : room_info)
	//{
	//	fmt::print("{} -> {}\n", r.first, r.second.id);

	//	for (const auto& e : r.second.entity->find_component_by_type<textworld::components::ExitComponent>())
	//	{
	//		fmt::print("\t{} -> {}\n", e->get_room_name(), e->get_direction_as_string());
	//	}
	//}

	auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("player inventory");
	auto stat_component = std::make_shared<textworld::components::StatsComponent>("player stats",
		textworld::data::Stat{ .current_value = 10, .max_value = 100 },
		textworld::data::Stat{ .current_value = 10, .max_value = 100 },
		textworld::data::Stat{ .current_value = 10, .max_value = 100 });
	auto player_description_component = std::make_shared<textworld::components::DescriptionComponent>("player description", "You are the hero!");
	auto id_component = std::make_shared<textworld::components::IdComponent>("players current room", entity_manager->get_entity_by_name("rooms", "Test Room 1")->get_id(), textworld::data::IdType::ROOM);
	auto currency_component = std::make_shared<textworld::components::CurrencyComponent>("gold", 10);

	player_entity->add_component(inventory_component);
	player_entity->add_component(stat_component);
	player_entity->add_component(player_description_component);
	player_entity->add_component(id_component);
	player_entity->add_component(currency_component);

	entity_manager->add_entity_to_group(output_entity, "core");
	entity_manager->add_entity_to_group(player_entity, "players");

	auto players_current_room = textworld::helpers::get_players_current_room(player_entity, entity_manager);

	auto show_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show current room description", players_current_room, textworld::data::DescriptionType::ROOM);
	player_entity->add_component(show_description_component);
	player_entity->add_component(textworld::helpers::get_room_exits(entity_manager, players_current_room));

	while (true)
	{
		textworld::systems::command_action_system(player_id, entity_manager);
		textworld::systems::quit_system(player_id, entity_manager);
		textworld::systems::room_movement_system(player_id, entity_manager);
		textworld::systems::description_system(player_id, entity_manager);
		//textworld::systems::item_system(player_id, entity_manager);
		textworld::systems::inventory_system(player_id, entity_manager);
		textworld::systems::unknown_command_system(player_id, entity_manager);
		textworld::systems::console_output_system(player_id, entity_manager);
		textworld::systems::console_input_system(player_id, entity_manager);
	}

	return 0;
}