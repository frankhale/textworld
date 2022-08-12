#include "../textworld.h"

int main()
{	
	auto player_entity = std::make_shared<textworld::ecs::Entity>("player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();

	mk_it("Coin Purse", "Extremely worn leather purse. The leather is soft and flexible and it's color has faded. There are 100 coins inside.", true, [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{ textworld::helpers::increase_value_on_entity_value_component<int>(player_entity, "gold", 100); });
	mk_it("Health Potion", "An oddly shaped bottle with a cool blue liquid inside. The liquid glows with an intense light.", true, [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{ textworld::helpers::increase_value_on_entity_value_component<int>(player_entity, "health", 25); });
	mk_it("Lamp", "A rusty old oil lamp", false, [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{ textworld::helpers::use_item_returns_message(player_entity, entity_manager, "The lamp flickers with a tiny flame"); });

	mk_npc("Old Man", "A really old man", (std::unordered_map<std::string, std::string>{ {"hello", "Hi there!"} }));

	begin_room_configuration();

	mk_rm("Open Field", "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.");
	mk_rm("Stream", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing.");
	mk_rm("Large Rock", "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings.");
	mk_rm("Old Forest", "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction.");
	mk_rm("Dark Passage", "Somehow you found a way to get into the forest. It's dark in here, the sound of the stream calms your nerves but you still feel a bit uneasy in here. The trunks of the trees stretch up into the heavens and the foliage above blocks most of the light.");

	mk_ex("Open Field", "Stream", textworld::data::Direction::NORTH);
	mk_ex("Stream", "Large Rock", textworld::data::Direction::EAST);
	mk_ex("Large Rock", "Old Forest", textworld::data::Direction::EAST);
	mk_ex("Old Forest", "Dark Passage", textworld::data::Direction::EAST);

	pl_it("Open Field", "Coin Purse", 1);
	pl_it("Open Field", "Health Potion", 3);
	pl_it("Large Rock", "Lamp", 1);

	pl_npc("Stream", "Old Man");

	//print_rooms();

	end_room_configuration();

	auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("player inventory");
	auto health_component = std::make_shared<textworld::components::ValueComponent<int>>("health", 10, 100);
	auto player_description_component = std::make_shared<textworld::components::DescriptionComponent>("player description", "You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!");
	auto id_component = std::make_shared<textworld::components::IdComponent>("players current room", entity_manager->get_entity_by_name("rooms", "Open Field")->get_id(), textworld::data::IdType::CURRENT_ROOM);
	auto currency_component = std::make_shared<textworld::components::ValueComponent<int>>("gold", 10);
	auto motd_description_component = std::make_shared<textworld::components::DescriptionComponent>("motd", "Welcome to Textworld! TW was written using a custom entity component system based engine. Look around, have fun!");

	player_entity->add_component(inventory_component);
	player_entity->add_component(health_component);
	player_entity->add_component(player_description_component);
	player_entity->add_component(id_component);
	player_entity->add_component(currency_component);
	player_entity->add_component(motd_description_component);

	entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::CORE, output_entity);
	entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::PLAYERS, player_entity);

	auto players_current_room = textworld::helpers::get_players_current_room(player_entity, entity_manager);

	auto show_current_room_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show current room description", players_current_room, textworld::data::DescriptionType::ROOM);
	auto show_npcs_in_room_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show NPCs in current room", player_entity, textworld::data::DescriptionType::NPC);

	player_entity->add_component(show_current_room_description_component);
	player_entity->add_component(show_npcs_in_room_description_component);
	player_entity->add_component(textworld::helpers::get_room_exits(entity_manager, players_current_room));

	textworld::systems::motd_system(player_entity, entity_manager);

	while (true)
	{
		textworld::systems::command_action_system(player_entity, entity_manager);
		textworld::systems::question_response_sequence_system(player_entity, entity_manager);
		textworld::systems::npc_dialog_system(player_entity, entity_manager);
		textworld::systems::quit_system(player_entity, entity_manager);
		textworld::systems::room_movement_system(player_entity, entity_manager);
		textworld::systems::description_system(player_entity, entity_manager);
		textworld::systems::inventory_system(player_entity, entity_manager);
		textworld::systems::unknown_command_system(player_entity, entity_manager);
		textworld::systems::console_output_system(player_entity, entity_manager);
		textworld::systems::console_input_system(player_entity, entity_manager);
	}

	return 0;
}