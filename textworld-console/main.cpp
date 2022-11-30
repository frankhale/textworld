#include "../textworld.h"

int main(int argc, char* argv[])
{
	auto entity_manager = textworld::helpers::make_entity_manager();

	mk_it_with_action("Coin Purse", "Extremely worn leather purse. The leather is soft and flexible and it's color has faded. There are 100 coins inside.", true,
		[](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{ textworld::helpers::increase_value_on_entity_value_component<int>(player_entity, "gold", 100);
			textworld::helpers::add_output_message(entity_manager, "Your gold has increased by 100"); });
	mk_it_with_action("Health Potion", "An oddly shaped bottle with a cool blue liquid inside. The liquid glows with an intense light.", true, [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{ textworld::helpers::increase_value_on_entity_value_component<int>(player_entity, "health", 25); });
	mk_it_with_action("Lamp", "A rusty old oil lamp", false, [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
		{ textworld::helpers::use_item_and_return_message(player_entity, entity_manager, "The lamp flickers with a tiny flame"); });
	mk_it("Iron ore", "A lump of raw iron ore");
	mk_it("Wood log", "A wood log");
	mk_it("Leather scrap", "A scrap of leather");

	mk_npc("Old Man", "A really old man", (std::unordered_map<std::string, std::string>{ 
		{ "hello", "Hi there!" },
		{ "boo", "Oh damn, you startled me!!!" }
	}));

	begin_room_configuration();

	mk_rm("Open Field", "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.");
	mk_rm("Stream", "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing.");
	mk_rm("Large Rock", "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings.");
	mk_rm("Old Forest", "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction.");
	mk_rm("Dark Passage", "Somehow you found a way to get into the forest. It's dark in here, the sound of the stream calms your nerves but you still feel a bit uneasy in here. The trunks of the trees stretch up into the heavens and the foliage above blocks most of the light.");

	mk_ex("Open Field", "Stream", textworld::data::Direction::NORTH);
	mk_ex("Stream", "Large Rock", textworld::data::Direction::EAST);
	mk_ex("Large Rock", "Old Forest", textworld::data::Direction::EAST);
	mk_ex_hidden("Old Forest", "Dark Passage", textworld::data::Direction::EAST);

	pl_it("Open Field", "Coin Purse", 1);
	pl_it("Open Field", "Health Potion", 3);
	pl_it("Large Rock", "Lamp", 1);

	pl_npc("Stream", "Old Man");

	end_room_configuration();

	auto player_entity = textworld::helpers::make_player(entity_manager,
		"player 1",
		entity_manager->get_entity_by_name("rooms", "Open Field")->get_id(),
		"You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!",
		"Welcome to Textworld! TW was written using a custom entity component system based engine. Look around, have fun!");

	entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::PLAYERS, player_entity);

	textworld::systems::motd_system(player_entity, entity_manager);

	while (true)
	{
		textworld::systems::command_action_system(player_entity, entity_manager);
		textworld::systems::question_response_sequence_system(player_entity, entity_manager);
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