#include "../textworld.h"

int main()
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();

	mk_it("Coin Purse", "Extremely worn leather purse. The leather is soft and flexible and it's color has faded. There are 100 coins inside.", true, [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{
			auto currency_component = player_entity->find_first_component_by_type<textworld::components::CurrencyComponent>();
			if (currency_component != nullptr) {
				currency_component->add(100);
			}
		});
	mk_it("Health Potion", "An oddly shaped bottle with a cool blue liquid inside. The liquid glows with an intense light.", true, [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{			
			auto stats_component = player_entity->find_first_component_by_type<textworld::components::StatsComponent>();
			if (stats_component != nullptr) {
				stats_component->add_health(50);
			}
		});
	mk_it("Lamp", "A rusty old oil lamp", false, [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{			
			auto output_entity = entity_manager->get_entity_by_name("core", "output");
			if (output_entity != nullptr) {				
				auto output_component = std::make_shared<textworld::components::OutputComponent>("lamp used", "The lamp flickers with a tiny flame");				
				output_entity->add_component(output_component);
			}
		});

	begin_room_configuration()
		mk_rm("Open Field", "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.");
		mk_rm("Stream", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing.");
		mk_rm("Large Rock", "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings.");
		mk_rm("Old Forest", "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction.");

		mk_ex("Open Field", "Stream", textworld::data::Direction::NORTH);
		mk_ex("Stream", "Large Rock", textworld::data::Direction::EAST);
		mk_ex("Large Rock", "Old Forest", textworld::data::Direction::EAST);

		pl_it("Open Field", "Coin Purse", 1);
		pl_it("Open Field", "Health Potion", 3);
		pl_it("Large Rock", "Lamp", 1);
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
	auto player_description_component = std::make_shared<textworld::components::DescriptionComponent>("player description", "You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!");
	auto id_component = std::make_shared<textworld::components::IdComponent>("players current room", entity_manager->get_entity_by_name("rooms", "Open Field")->get_id(), textworld::data::IdType::ROOM);
	auto currency_component = std::make_shared<textworld::components::CurrencyComponent>("gold", 10);
	
	auto motd_description_component = std::make_shared<textworld::components::DescriptionComponent>("motd", "Welcome to Textworld! TW was written using a custom entity component system based engine. Look around, have fun!");

	player_entity->add_component(inventory_component);
	player_entity->add_component(stat_component);
	player_entity->add_component(player_description_component);
	player_entity->add_component(id_component);
	player_entity->add_component(currency_component);
	player_entity->add_component(motd_description_component);

	entity_manager->add_entity_to_group(output_entity, "core");
	entity_manager->add_entity_to_group(player_entity, "players");

	auto players_current_room = textworld::helpers::get_players_current_room(player_entity, entity_manager);

	auto show_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show current room description", players_current_room, textworld::data::DescriptionType::ROOM);
	player_entity->add_component(show_description_component);
	player_entity->add_component(textworld::helpers::get_room_exits(entity_manager, players_current_room));

	textworld::systems::motd_system(player_id, entity_manager);
	
	while (true)
	{
		textworld::systems::command_action_system(player_id, entity_manager);
		textworld::systems::quit_system(player_id, entity_manager);
		textworld::systems::room_movement_system(player_id, entity_manager);
		textworld::systems::description_system(player_id, entity_manager);		
		textworld::systems::inventory_system(player_id, entity_manager);
		textworld::systems::unknown_command_system(player_id, entity_manager);
		textworld::systems::console_output_system(player_id, entity_manager);
		textworld::systems::console_input_system(player_id, entity_manager);
	}

	return 0;
}