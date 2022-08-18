#include "../textworld.h"

int main(int argc, char* argv[])
{
	auto engine = std::make_unique<textworld::gfx::Engine>();
	engine->init("Hello, World!", 1024, 600, false);
	engine->game_loop();

	return 0;
}