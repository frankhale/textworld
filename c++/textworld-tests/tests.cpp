#include <gtest/gtest.h>
#include "../textworld.h"

TEST(Misc, CanStringifyVectorOfStrings)
{
	auto vector_of_strings = std::vector<std::string>{ "one", "two", "three" };
	auto stringified_vector_of_strings = get_vector_of_strings_as_strings(vector_of_strings);
	EXPECT_EQ(stringified_vector_of_strings, "one two three");
}

TEST(Misc, CanConvertStringToLowerCase)
{
	std::string string = "HELLO";
	to_lower(string);
	EXPECT_EQ(string, "hello");
}

TEST(Misc, CanConvertStringToUpperCase)
{
	std::string string = "hello";
	to_upper(string);
	EXPECT_EQ(string, "HELLO");
}

TEST(Misc, CanConvertStringToTitleCase)
{
	std::string string = "hello";
	to_titlecase(string);
	EXPECT_EQ(string, "Hello");
}

TEST(Misc, CanGenerateUUID)
{
	auto uuid = generate_uuid();
	EXPECT_EQ(uuid.size(), 36);
}

TEST(Misc, CanFindValueInMap)
{
	auto entity = std::make_shared<textworld::ecs::Entity>("entity");
	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::PLAYERS, entity);

	int meaning_of_life = 1;

	auto map = std::unordered_map<std::string, textworld::core::action_func>{
		{ "foo", [&](std::shared_ptr<textworld::ecs::Entity> p, std::shared_ptr<textworld::ecs::EntityManager> em) { meaning_of_life = 22; }},
		{ "foo bar", [&](std::shared_ptr<textworld::ecs::Entity> p, std::shared_ptr<textworld::ecs::EntityManager> em) { meaning_of_life = 32; } },
		{ "foo bar baz", [&](std::shared_ptr<textworld::ecs::Entity> p, std::shared_ptr<textworld::ecs::EntityManager> em) { meaning_of_life = 42; } }
	};

	auto value = textworld::helpers::find_value_in_map<textworld::core::action_func>
		(map,
			"foo bar baz",
			std::vector<std::string>{ "foo", "bar", "baz" });

	EXPECT_NE(value, nullptr);
	value(entity, entity_manager);
	EXPECT_EQ(meaning_of_life, 42);

	value = textworld::helpers::find_value_in_map<textworld::core::action_func>
		(map,
			"foo bar",
			std::vector<std::string>{ "foo", "bar" });

	EXPECT_NE(value, nullptr);
	value(entity, entity_manager);
	EXPECT_EQ(meaning_of_life, 32);

	value = textworld::helpers::find_value_in_map<textworld::core::action_func>
		(map,
			"foo",
			std::vector<std::string>{ "foo" });

	EXPECT_NE(value, nullptr);
	value(entity, entity_manager);
	EXPECT_EQ(meaning_of_life, 22);
}

TEST(ECS, CommandComponentWithCommandAndArgs)
{
	textworld::components::CommandInputComponent command_component("command_component", "command arg1 arg2");

	auto command = command_component.get_command();
	auto arguments = command_component.get_arguments();
	auto command_with_arguments = command_component.get_command_with_arguments();

	EXPECT_EQ(command, "command");
	EXPECT_EQ(arguments.size(), 2);
	EXPECT_EQ(arguments[0], "arg1");
	EXPECT_EQ(arguments[1], "arg2");
	EXPECT_EQ(command_with_arguments, "command arg1 arg2");
}

TEST(ECS, CanGetPlayersCurrentRoom)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");

	auto room_id = generate_uuid();
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_id, "room_1");

	// add an id component to the player
	player_entity->add_component(std::make_shared<textworld::components::IdComponent>("id_component", room_id, textworld::data::IdType::CURRENT_ROOM));

	// add player and room to entity manager
	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);

	// get player's current room
	auto current_room = textworld::helpers::get_players_current_room(player_entity, entity_manager);

	EXPECT_NE(current_room, nullptr);
	EXPECT_EQ(current_room->get_id(), room_id);
}

TEST(ECS, CanChangePlayerCurrentRoomToNewRoom)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");

	auto room_1_id = generate_uuid();
	auto room_1_entity = std::make_shared<textworld::ecs::Entity>(room_1_id, "room_1");

	auto room_2_id = generate_uuid();
	auto room_2_entity = std::make_shared<textworld::ecs::Entity>(room_2_id, "room_2");

	// add an id component to the player
	auto id_component = std::make_shared<textworld::components::IdComponent>("id_component", room_1_id, textworld::data::IdType::CURRENT_ROOM);
	player_entity->add_component(id_component);

	// add player and room to entity manager
	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("rooms", room_1_entity);
	entity_manager->add_entity_to_group("rooms", room_2_entity);

	textworld::systems::room_movement_system(player_entity, entity_manager);

	// get player's current room
	auto current_room_1 = textworld::helpers::get_players_current_room(player_entity, entity_manager);

	EXPECT_NE(current_room_1, nullptr);
	EXPECT_EQ(current_room_1->get_id(), room_1_id);

	id_component->set_target_id(room_2_id);

	textworld::systems::room_movement_system(player_entity, entity_manager);

	auto current_room_2 = textworld::helpers::get_players_current_room(player_entity, entity_manager);

	EXPECT_NE(current_room_2, nullptr);
	EXPECT_EQ(current_room_2->get_id(), room_2_id);
}

TEST(ECS, CanGetExitInfoFromRoom)
{
	auto room_1_id = generate_uuid();
	auto room_2_id = generate_uuid();
	auto room_3_id = generate_uuid();

	auto room_entity_1 = std::make_shared<textworld::ecs::Entity>(room_1_id, "room_1");
	auto room_entity_2 = std::make_shared<textworld::ecs::Entity>(room_2_id, "room_2");
	auto room_entity_3 = std::make_shared<textworld::ecs::Entity>(room_3_id, "room_3");

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("rooms", room_entity_1);
	entity_manager->add_entity_to_group("rooms", room_entity_2);
	entity_manager->add_entity_to_group("rooms", room_entity_3);

	room_entity_1->add_component(std::make_shared<textworld::components::ExitComponent>("exit_component", textworld::data::Direction::EAST, room_2_id, false));
	room_entity_2->add_component(std::make_shared<textworld::components::ExitComponent>("exit_component", textworld::data::Direction::WEST, room_1_id, false));
	room_entity_2->add_component(std::make_shared<textworld::components::ExitComponent>("exit_component", textworld::data::Direction::EAST, room_3_id, false));
	room_entity_3->add_component(std::make_shared<textworld::components::ExitComponent>("exit_component", textworld::data::Direction::WEST, room_2_id, false));

	auto exit_info_description_component_for_room_1 = textworld::helpers::get_room_exits(entity_manager, room_entity_1);
	auto exit_info_description_component_for_room_2 = textworld::helpers::get_room_exits(entity_manager, room_entity_2);
	auto exit_info_description_component_for_room_3 = textworld::helpers::get_room_exits(entity_manager, room_entity_3);

	// room_1 = "Exits: [\"East : room_2\"]"
	// room_2 = "Exits: [\"West : room_1\", \"East : room_3\"]"
	// room_3 = "Exits: [\"West : room_2\"]"

	EXPECT_EQ(exit_info_description_component_for_room_1->get_name(), "Exits: [\"East : room_2\"]");
	EXPECT_EQ(exit_info_description_component_for_room_2->get_name(), "Exits: [\"West : room_1\", \"East : room_3\"]");
	EXPECT_EQ(exit_info_description_component_for_room_3->get_name(), "Exits: [\"West : room_2\"]");
}

TEST(ECS, CanAddItemToPlayerInventory)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");

	auto item_entity_id = generate_uuid();
	auto item_entity = std::make_shared<textworld::ecs::Entity>(item_entity_id, "item_entity");

	auto item = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = generate_uuid(), .name = "item_1", .description = "This is a test item" });

	auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("inventory_component");
	inventory_component->add_item({ .id = item->id, .name = "item_1", .quantity = 1 });
	player_entity->add_component(inventory_component);

	auto item_component = std::make_shared<textworld::components::ItemComponent>("item_component", item);
	item_entity->add_component(item_component);

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_entity);

	auto _item_1 = inventory_component->get_item(item->id);

	EXPECT_GT(inventory_component->get_size(), 0);
	EXPECT_EQ(_item_1->id, item->id);
}

TEST(ECS, CanRemoveItemFromPlayerInventory)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");

	auto item_entity_id = generate_uuid();
	auto item_entity = std::make_shared<textworld::ecs::Entity>(item_entity_id, "item_entity");

	auto item = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = generate_uuid(), .name = "item_1", .description = "This is a test item" });

	auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("inventory_component");
	inventory_component->add_item({ .id = item->id, .name = "item_1", .quantity = 1 });
	player_entity->add_component(inventory_component);

	auto item_component = std::make_shared<textworld::components::ItemComponent>("item_component", item);
	item_entity->add_component(item_component);

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_entity);

	auto _item_1 = inventory_component->get_item(item->id);

	EXPECT_GT(inventory_component->get_size(), 0);
	EXPECT_EQ(_item_1->id, item->id);

	inventory_component->remove_item(item->id);

	EXPECT_EQ(inventory_component->get_size(), 0);
}

TEST(ECS, CanAddItemToPlayerInventoryAndReturnAsString)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");

	auto item_entity_id = generate_uuid();
	auto item_entity = std::make_shared<textworld::ecs::Entity>(item_entity_id, "item_entity");

	auto item = std::make_shared<textworld::data::Item>(textworld::data::Item{
			.id = generate_uuid(),
			.name = "item_1",
			.description = "This is a test item" });

	auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("inventory_component");
	inventory_component->add_item({ .id = item->id, .name = "item_1", .quantity = 1 });
	player_entity->add_component(inventory_component);

	auto item_component = std::make_shared<textworld::components::ItemComponent>("item_component", item);
	item_entity->add_component(item_component);

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_entity);

	auto _item_1 = inventory_component->get_item(item->id);

	EXPECT_GT(inventory_component->get_size(), 0);
	EXPECT_EQ(_item_1->id, item->id);

	auto item_string = inventory_component->get_items_string();

	EXPECT_EQ(item_string, "item_1: (1)");
}

TEST(ECS, CanMakeConsumableItem)
{
	auto i = textworld::helpers::make_consumable_item("coin purse", "a leather coin purse", { {"default", [](std::shared_ptr<textworld::ecs::Entity> player, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
																																														{
			// do something on use
		}} });

	EXPECT_EQ(i->name, "coin purse");
	EXPECT_EQ(i->description, "a leather coin purse");
	EXPECT_TRUE(i->consumable);
	EXPECT_EQ(i->actions.size(), 1);
}

TEST(ECS, CanIncreaseValueOfValueComponent)
{
	auto player_entity = std::make_shared<textworld::ecs::Entity>("player_1");

	auto value_component = std::make_shared<textworld::components::ValueComponent<int>>("value_component", 10);

	player_entity->add_component(value_component);

	textworld::helpers::increase_value_on_entity_value_component<int>(player_entity, "value_component", 10);

	EXPECT_EQ(value_component->get_value(), 20);
}

TEST(ECS, CanMakeItem)
{
	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	mk_it_with_action("Coin Purse", "Extremely worn leather purse. The leather is soft and flexible and it's color has faded. There are 100 coins inside.", true, [](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager) {});

	auto items = entity_manager->get_entity_group(textworld::ecs::EntityGroupName::ITEMS);
	auto coin_purse = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::ITEMS, "Coin Purse");

	EXPECT_EQ(items->entities->size(), 1);
	EXPECT_EQ(coin_purse->get_name(), "Coin Purse");
}

TEST(ECS, CanMakeNPC)
{
	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();

	mk_npc("Old Man", "A really old man", (std::unordered_map<std::string, std::string>{ {"foo", "bar"}, { "bar", "foo" }, { "baz", "boz" }}));

	auto npcs = entity_manager->get_entity_group(textworld::ecs::EntityGroupName::NPCS);
	auto old_man = entity_manager->get_entity_by_name(textworld::ecs::EntityGroupName::NPCS, "Old Man");

	EXPECT_EQ(npcs->entities->size(), 1);
	EXPECT_EQ(old_man->get_name(), "Old Man");
}

TEST(ECS, CanPlaceComponentsOnHold)
{
	auto entity = std::make_shared<textworld::ecs::Entity>("entity");
	auto description_component = std::make_shared<textworld::components::DescriptionComponent>("description_component", "This is a test room");

	entity->add_component(description_component);

	auto on_hold_component = std::make_shared<textworld::components::ComponentsOnHoldComponent>("on_hold_component");
	on_hold_component->place_component_on_hold<textworld::components::DescriptionComponent>(entity);

	EXPECT_EQ(entity->get_component_count(), 0);
	EXPECT_EQ(on_hold_component->get_component_count(), 1);

	on_hold_component->release_all_components_from_hold(entity);

	EXPECT_EQ(entity->get_component_count(), 1);
	EXPECT_EQ(on_hold_component->get_component_count(), 0);
}

TEST(ECS, CanSetFlagsOnEntity)
{
	auto entity = std::make_shared<textworld::ecs::Entity>("entity");

	entity->add_component(std::make_shared<textworld::components::FlagComponent>("flag",
		std::vector<textworld::data::Flag>{ textworld::data::Flag::COMMAND_ACTION_SYSTEM_BYPASS }));

	//auto flag_component = std::make_shared<textworld::components::FlagComponent>("flag", std::vector<textworld::data::Flag>{
	//	textworld::data::Flag::COMMAND_ACTION_SYSTEM_BYPASS,
	//	textworld::data::Flag::ROOM_DESCRIPTION_SYSTEM_BYPASS,
	//	textworld::data::Flag::ROOM_MOVEMENT_SYSTEM_BYPASS,
	//	textworld::data::Flag::INVENTORY_SYSTEM_BYPASS,
	//	textworld::data::Flag::NPC_DIALOG_SYSTEM_BYPASS,
	//	textworld::data::Flag::DESCRIPTION_SYSTEM_BYPASS
	//});

	auto flag_component = entity->find_first_component_by_type<textworld::components::FlagComponent>();

	EXPECT_NE(flag_component, nullptr);
	EXPECT_TRUE(flag_component->is_set(textworld::data::Flag::COMMAND_ACTION_SYSTEM_BYPASS));
}

TEST(Systems, CanShowMOTD)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");

	auto motd_component = std::make_shared<textworld::components::DescriptionComponent>("motd", "This is the MOTD");
	player_entity->add_component(motd_component);

	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	textworld::systems::motd_system(player_entity, entity_manager);

	auto output_components = output_entity->find_components_by_type<textworld::components::OutputComponent>();

	EXPECT_GT(output_components.size(), 0);
	EXPECT_EQ(output_components.front()->get_value(), "This is the MOTD");
}

TEST(Systems, CanCompleteQuestionResponseSequence)
{
	auto player_entity = std::make_shared<textworld::ecs::Entity>("player");
	auto room_entity = std::make_shared<textworld::ecs::Entity>("room");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();

	entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::PLAYERS, player_entity);
	entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::ROOMS, room_entity);
	entity_manager->add_entity_to_group(textworld::ecs::EntityGroupName::CORE, output_entity);

	auto question_response_sequence_component = std::make_shared<textworld::components::QuestionResponseSequenceComponent>("question_response_sequence_component",
		std::vector<std::string>{
			{ "What is your name?" },
			{ "What is your favorite color?" },
	});

	//auto flag_component = std::make_shared<textworld::components::FlagComponent>("flag", std::vector<textworld::data::Flag>{
	//	textworld::data::Flag::COMMAND_ACTION_SYSTEM_BYPASS,
	//	textworld::data::Flag::ROOM_DESCRIPTION_SYSTEM_BYPASS,
	//	textworld::data::Flag::ROOM_MOVEMENT_SYSTEM_BYPASS,
	//	textworld::data::Flag::INVENTORY_SYSTEM_BYPASS,
	//	textworld::data::Flag::NPC_DIALOG_SYSTEM_BYPASS,
	//	textworld::data::Flag::DESCRIPTION_SYSTEM_BYPASS
	//});

	//player_entity->add_component(flag_component);
	player_entity->add_component(question_response_sequence_component);

	textworld::systems::question_response_sequence_system(player_entity, entity_manager);

	auto output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();
	EXPECT_NE(output_component, nullptr);
	EXPECT_EQ(output_component->get_value(), "What is your name?");

	output_entity->clear_components();

	auto command_component = std::make_shared<textworld::components::CommandInputComponent>("command", "Frank");
	player_entity->add_component(command_component);

	textworld::systems::question_response_sequence_system(player_entity, entity_manager);

	output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();
	EXPECT_NE(output_component, nullptr);
	EXPECT_EQ(output_component->get_value(), "You answered with: Frank");

	player_entity->remove_component(command_component);
	output_entity->clear_components();

	textworld::systems::question_response_sequence_system(player_entity, entity_manager);

	output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();
	EXPECT_NE(output_component, nullptr);
	EXPECT_EQ(output_component->get_value(), "What is your favorite color?");

	output_entity->clear_components();

	command_component = std::make_shared<textworld::components::CommandInputComponent>("command", "red");
	player_entity->add_component(command_component);

	textworld::systems::question_response_sequence_system(player_entity, entity_manager);

	output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();
	EXPECT_NE(output_component, nullptr);
	EXPECT_EQ(output_component->get_value(), "You answered with: red");
}

TEST(Systems, RoomDescriptionSystemOutputsRoomDescription)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");

	auto room_id = generate_uuid();
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_id, "room_1");

	auto show_description_component = std::make_shared<textworld::components::ShowDescriptionComponent>("show_description_component", room_entity, textworld::data::DescriptionType::ROOM);
	player_entity->add_component(show_description_component);

	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	auto room_description_component = std::make_shared<textworld::components::DescriptionComponent>("room_description_component", "This is a room");
	room_entity->add_component(room_description_component);

	textworld::systems::room_movement_system(player_entity, entity_manager);
	textworld::systems::description_system(player_entity, entity_manager);

	auto output_components = output_entity->find_components_by_type<textworld::components::OutputComponent>();

	EXPECT_GT(output_components.size(), 0);
	EXPECT_EQ(output_components.front()->get_value(), "This is a room");
}

TEST(Systems, CanProcessCommandActionComponentsOnPlayers)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");

	auto action =
		[&](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
	{
		if (player_entity != nullptr)
		{
			// we'd do some arbitary action here but for testing purposes we
			// will just return an output component on the player that simulates
			// that we executed the action

			player_entity->add_component(std::make_shared<textworld::components::OutputComponent>("command_component", "foo command executed"));
		}
	};

	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
	auto command_action_component = std::make_shared<textworld::components::CommandActionComponent>("command_action_component", "foo", action);
	auto command_component = std::make_shared<textworld::components::CommandInputComponent>("command_component", "foo");

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		command_component,
		command_action_component,
		command_set_component
	});

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);

	// run command system
	textworld::systems::command_action_system(player_entity, entity_manager);

	// check if output component was added to player
	auto output_components = player_entity->find_components_by_type<textworld::components::OutputComponent>();

	EXPECT_EQ(output_components.size(), 1);

	if (output_components.size() > 0)
	{
		EXPECT_EQ(output_components[0]->get_value(), "foo command executed");
	}
}

TEST(Systems, PlayerCanNavigateToNewRoom)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");

	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");

	auto room_1_id = generate_uuid();
	auto room_2_id = generate_uuid();

	auto room_entity_1 = std::make_shared<textworld::ecs::Entity>(room_1_id, "room_1");
	auto room_entity_2 = std::make_shared<textworld::ecs::Entity>(room_2_id, "room_2");

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("rooms", room_entity_1);
	entity_manager->add_entity_to_group("rooms", room_entity_2);
	entity_manager->add_entity_to_group("core", output_entity);

	room_entity_1->add_component(std::make_shared<textworld::components::ExitComponent>("exit_component", textworld::data::Direction::EAST, room_2_id, false));
	room_entity_2->add_component(std::make_shared<textworld::components::ExitComponent>("exit_component", textworld::data::Direction::WEST, room_1_id, false));

	auto command_component_1 = std::make_shared<textworld::components::CommandInputComponent>("command_component", "east");

	player_entity->add_component(std::make_shared<textworld::components::IdComponent>("id_component", room_1_id, textworld::data::IdType::CURRENT_ROOM));
	player_entity->add_component(command_component_1);

	textworld::systems::room_movement_system(player_entity, entity_manager);

	auto current_room_1 = textworld::helpers::get_players_current_room(player_entity, entity_manager);
	EXPECT_EQ(current_room_1->get_id(), room_2_id);

	auto command_component_2 = std::make_shared<textworld::components::CommandInputComponent>("command_component", "west");
	player_entity->add_component(command_component_2);

	textworld::systems::room_movement_system(player_entity, entity_manager);

	auto current_room_2 = textworld::helpers::get_players_current_room(player_entity, entity_manager);
	EXPECT_EQ(current_room_2->get_id(), room_1_id);
}

TEST(Actions, CanShowItem)
{
	auto player_id = generate_uuid();
	auto item_entity_id = generate_uuid();
	auto room_entity_id = generate_uuid();

	auto item = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = item_entity_id, .name = "item_1", .description = "This is a test item" });

	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto item_entity = std::make_shared<textworld::ecs::Entity>(item_entity_id, "item_1");
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_entity_id, "room_entity");

	auto players_current_room_id_component = std::make_shared<textworld::components::IdComponent>(textworld::components::IdComponent("id_component", room_entity_id, textworld::data::IdType::CURRENT_ROOM));
	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
	auto command_action_component = std::make_shared<textworld::components::CommandActionComponent>("command_action_component",
		"show item_1",
		textworld::core::show_item_action);

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		players_current_room_id_component,
		command_set_component,
		command_action_component
	});

	item_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item));

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	auto item_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item->id, item->name, 1);
	room_entity->add_component(item_drop_component);

	textworld::systems::command_action_system(player_entity, entity_manager);

	auto output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();

	EXPECT_EQ(output_component->get_value(), "item_1 (1) : This is a test item");
}

TEST(Actions, CanShowAllItems)
{
	auto player_id = generate_uuid();
	auto item_1_entity_id = generate_uuid();
	auto item_2_entity_id = generate_uuid();
	auto room_entity_id = generate_uuid();

	auto item_1 = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = item_1_entity_id, .name = "item_1", .description = "This is a test item #1" });
	auto item_2 = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = item_2_entity_id, .name = "item_2", .description = "This is a test item #2" });

	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto item_1_entity = std::make_shared<textworld::ecs::Entity>(item_1_entity_id, "item_1");
	auto item_2_entity = std::make_shared<textworld::ecs::Entity>(item_2_entity_id, "item_2");
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_entity_id, "room_entity");

	auto players_current_room_id_component = std::make_shared<textworld::components::IdComponent>(textworld::components::IdComponent("id_component", room_entity_id, textworld::data::IdType::CURRENT_ROOM));
	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
	auto item_action_component = std::make_shared<textworld::components::CommandActionComponent>("command_action_component",
		"show all",
		textworld::core::show_all_items_action);

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		players_current_room_id_component,
		command_set_component,
		item_action_component
	});

	item_1_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item_1));
	item_2_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item_2));

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_1_entity);
	entity_manager->add_entity_to_group("items", item_2_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	auto item_1_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item_1->id, item_1->name, 1);
	auto item_2_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item_2->id, item_2->name, 1);
	room_entity->add_component(item_1_drop_component);
	room_entity->add_component(item_2_drop_component);

	textworld::systems::command_action_system(player_entity, entity_manager);

	auto output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();

	// The following items are here:\n
	// item_1(1) : This is a test item #1,\n
	// item_2 (1) : This is a test item #2\n

	EXPECT_EQ(output_component->get_value(), "The following items are here:\nitem_1 (1) : This is a test item #1\nitem_2 (1) : This is a test item #2");
}

TEST(Actions, CanTakeItem)
{
	auto player_id = generate_uuid();
	auto item_entity_id = generate_uuid();
	auto room_entity_id = generate_uuid();

	auto item = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = item_entity_id, .name = "item_1", .description = "This is a test item" });

	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto item_entity = std::make_shared<textworld::ecs::Entity>(item_entity_id, "item_1");
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_entity_id, "room_entity");

	auto players_current_room_id_component = std::make_shared<textworld::components::IdComponent>(textworld::components::IdComponent("id_component", room_entity_id, textworld::data::IdType::CURRENT_ROOM));
	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
	auto item_action_component = std::make_shared<textworld::components::CommandActionComponent>("command_action_component",
		"take item_1",
		textworld::core::take_item_action);

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		players_current_room_id_component,
		command_set_component,
		item_action_component
	});

	item_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item));

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	auto item_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item->id, item->name, 1);
	room_entity->add_component(item_drop_component);

	textworld::systems::command_action_system(player_entity, entity_manager);

	auto output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();

	EXPECT_EQ(output_component->get_value(), "You've taken item_1");
}

TEST(Actions, CanTakeAllItems)
{
	auto player_id = generate_uuid();
	auto item_1_entity_id = generate_uuid();
	auto item_2_entity_id = generate_uuid();
	auto room_entity_id = generate_uuid();

	auto item_1 = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = item_1_entity_id, .name = "item_1", .description = "This is a test item #1" });
	auto item_2 = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = item_2_entity_id, .name = "item_2", .description = "This is a test item #2" });

	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto item_1_entity = std::make_shared<textworld::ecs::Entity>(item_1_entity_id, "item_1_entity");
	auto item_2_entity = std::make_shared<textworld::ecs::Entity>(item_2_entity_id, "item_2_entity");
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_entity_id, "room_entity");

	auto players_current_room_id_component = std::make_shared<textworld::components::IdComponent>(textworld::components::IdComponent("id_component", room_entity_id, textworld::data::IdType::CURRENT_ROOM));
	auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("inventory_component");
	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
	auto command_action_component = std::make_shared<textworld::components::CommandActionComponent>("command_action_component",
		"take all",
		textworld::core::take_all_items_action);

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		players_current_room_id_component,
		command_set_component,
		command_action_component,
		inventory_component,
	});

	item_1_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item_1));
	item_2_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item_2));

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_1_entity);
	entity_manager->add_entity_to_group("items", item_2_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	auto item_1_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item_1->id, item_1->name, 1);
	auto item_2_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item_2->id, item_2->name, 1);
	room_entity->add_component(item_1_drop_component);
	room_entity->add_component(item_2_drop_component);

	textworld::systems::command_action_system(player_entity, entity_manager);

	auto output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();

	EXPECT_EQ(output_component->get_value(), "You've taken the following items:\nitem_1 (1) : This is a test item #1\nitem_2 (1) : This is a test item #2");

	auto i1 = inventory_component->get_item(item_1->id);
	auto i2 = inventory_component->get_item(item_2->id);

	EXPECT_EQ(i1->id, item_1->id);
	EXPECT_EQ(i2->id, item_2->id);
}

TEST(Actions, CanDropItem)
{
	auto player_id = generate_uuid();
	auto item_entity_id = generate_uuid();
	auto room_entity_id = generate_uuid();

	auto item = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = item_entity_id, .name = "item_1", .description = "This is a test item" });

	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto item_entity = std::make_shared<textworld::ecs::Entity>(item_entity_id, "item_1");
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_entity_id, "room_entity");

	auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("inventory_component",
		std::vector<textworld::data::ItemPickup>{ { item->id, item->name, 1 }});

	auto players_current_room_id_component = std::make_shared<textworld::components::IdComponent>(textworld::components::IdComponent("id_component", room_entity_id, textworld::data::IdType::CURRENT_ROOM));
	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
	auto command_action_component = std::make_shared<textworld::components::CommandActionComponent>("command_action_component",
		"drop item_1",
		textworld::core::drop_item_action);

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		players_current_room_id_component,
		inventory_component,
		command_set_component,
		command_action_component
	});

	item_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item));

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	auto item_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item->id, item->name, 1);
	room_entity->add_component(item_drop_component);

	textworld::systems::command_action_system(player_entity, entity_manager);

	auto output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();

	EXPECT_EQ(output_component->get_value(), "You've dropped item_1");
}

TEST(Actions, CanDropAllItems)
{
	auto player_id = generate_uuid();
	auto item_1_entity_id = generate_uuid();
	auto item_2_entity_id = generate_uuid();
	auto room_entity_id = generate_uuid();

	auto item_1 = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = item_1_entity_id, .name = "item_1", .description = "This is a test item #1" });
	auto item_2 = std::make_shared<textworld::data::Item>(textworld::data::Item{ .id = item_2_entity_id, .name = "item_2", .description = "This is a test item #2" });

	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto item_1_entity = std::make_shared<textworld::ecs::Entity>(item_1_entity_id, "item_1");
	auto item_2_entity = std::make_shared<textworld::ecs::Entity>(item_2_entity_id, "item_2");
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_entity_id, "room_entity");

	auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("inventory_component");
	inventory_component->add_item({ item_1->id, item_1->name, 1 });
	inventory_component->add_item({ item_2->id, item_2->name, 1 });

	item_1_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item_1));
	item_2_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item_2));

	auto players_current_room_id_component = std::make_shared<textworld::components::IdComponent>(textworld::components::IdComponent("id_component", room_entity_id, textworld::data::IdType::CURRENT_ROOM));
	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
	auto command_action_component = std::make_shared<textworld::components::CommandActionComponent>("command_action_component",
		"drop all",
		textworld::core::drop_all_items_action);

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		players_current_room_id_component,
		inventory_component,
		command_set_component,
		command_action_component
	});

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_1_entity);
	entity_manager->add_entity_to_group("items", item_2_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	auto item_1_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item_1->id, item_1->name, 1);
	auto item_2_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item_2->id, item_2->name, 1);
	room_entity->add_component(item_1_drop_component);
	room_entity->add_component(item_2_drop_component);

	textworld::systems::command_action_system(player_entity, entity_manager);

	auto output_component = output_entity->find_first_component_by_type<textworld::components::OutputComponent>();

	EXPECT_EQ(output_component->get_value(), "You've dropped all items");

	auto inv_size = inventory_component->get_size();

	EXPECT_EQ(inv_size, 0);
}

TEST(Actions, CanUseItem)
{
	auto player_id = generate_uuid();
	auto item_entity_id = generate_uuid();
	auto room_entity_id = generate_uuid();

	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");
	auto item_entity = std::make_shared<textworld::ecs::Entity>(item_entity_id, "item_1");
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_entity_id, "room_entity");

	auto inventory_component = std::make_shared<textworld::components::InventoryComponent>("inventory_component");

	auto item = std::make_shared<textworld::data::Item>(textworld::data::Item{
			.id = item_entity_id,
			.name = "item_1",
			.description = "This is a test item",
			.consumable = true,
			.actions = {
					{"default", [&](std::shared_ptr<textworld::ecs::Entity> player_entity, std::shared_ptr<textworld::ecs::EntityManager> entity_manager)
					 {
						 auto output_component = std::make_shared<textworld::components::OutputComponent>("output_component", "You've used the item");
						 output_entity->add_component(output_component);
					 }}} });

	inventory_component->add_item({ item->id, item->name, 1 });

	item_entity->add_component(std::make_shared<textworld::components::ItemComponent>("item_component", item));

	auto players_current_room_id_component = std::make_shared<textworld::components::IdComponent>(textworld::components::IdComponent("id_component", room_entity_id, textworld::data::IdType::CURRENT_ROOM));
	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
	auto command_action_component = std::make_shared<textworld::components::CommandActionComponent>("command action component", "use item_1", textworld::core::use_item_from_inventory_action);

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		players_current_room_id_component,
		command_action_component,
		inventory_component,
		command_set_component
	});

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("items", item_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	auto item_drop_component = std::make_shared<textworld::components::ItemDropComponent>("item_drop_component", item->id, item->name, 1);
	room_entity->add_component(item_drop_component);

	textworld::systems::command_action_system(player_entity, entity_manager);

	auto output_components = output_entity->find_components_by_type<textworld::components::OutputComponent>();

	EXPECT_EQ(output_components.back()->get_value(), "You've used the item");

	auto inv_size = inventory_component->get_size();

	EXPECT_EQ(inv_size, 0);
}

TEST(Actions, CanLookAtSelf)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");

	auto description_component = std::make_shared<textworld::components::DescriptionComponent>("description_component", "You are the hero!");
	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);
	auto command_input_component = std::make_shared<textworld::components::CommandInputComponent>("command_input_component", "look self");

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		command_input_component,
		command_set_component,
		description_component
	});

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("core", output_entity);

	textworld::systems::command_action_system(player_entity, entity_manager);

	auto show_description_component = player_entity->find_first_component_by_type<textworld::components::ShowDescriptionComponent>();

	auto description_component_from_output = show_description_component->get_entity()->find_first_component_by_type<textworld::components::DescriptionComponent>();

	EXPECT_EQ(description_component->get_description(), "You are the hero!");
}

TEST(Actions, CanLookAtRoom)
{
	auto player_id = generate_uuid();
	auto player_entity = std::make_shared<textworld::ecs::Entity>(player_id, "player_1");
	auto output_entity = std::make_shared<textworld::ecs::Entity>("output");

	auto room_entity_id = generate_uuid();
	auto room_entity = std::make_shared<textworld::ecs::Entity>(room_entity_id, "room_1");
	auto room_description_component = std::make_shared<textworld::components::DescriptionComponent>("description_component", "This is a test room");
	room_entity->add_component(room_description_component);

	auto id_component = std::make_shared<textworld::components::IdComponent>(textworld::components::IdComponent("id_component", room_entity_id, textworld::data::IdType::CURRENT_ROOM));
	auto description_component = std::make_shared<textworld::components::DescriptionComponent>("description_component", "You are the hero!");
	auto command_input_component = std::make_shared<textworld::components::CommandInputComponent>("command_input_component", "look");
	auto command_set_component = std::make_shared<textworld::components::CommandSetComponent>(textworld::data::CommandSet::CORE, textworld::core::command_to_actions);

	player_entity->add_components(std::vector<std::shared_ptr<textworld::ecs::Component>>{
		command_set_component,
		id_component,
		description_component,
		command_input_component
	});

	auto entity_manager = std::make_shared<textworld::ecs::EntityManager>();
	entity_manager->add_entity_to_group("players", player_entity);
	entity_manager->add_entity_to_group("core", output_entity);
	entity_manager->add_entity_to_group("rooms", room_entity);

	textworld::systems::command_action_system(player_entity, entity_manager);

	auto show_description_component = player_entity->find_first_component_by_type<textworld::components::ShowDescriptionComponent>();
	auto description_component_from_output = show_description_component->get_entity()->find_components_by_type<textworld::components::DescriptionComponent>().front();

	EXPECT_EQ(show_description_component->get_entity(), room_entity);
	EXPECT_EQ(description_component_from_output->get_description(), "This is a test room");
}