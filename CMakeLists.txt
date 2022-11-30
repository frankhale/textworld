cmake_minimum_required(VERSION 3.8)

if(WIN32)
	cmake_policy(SET CMP0091 NEW)
	set(VCPKG_TARGET_TRIPLET "x64-windows-static" CACHE STRING "target triplet" FORCE)
	set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

project(textworld CXX)

find_package(magic_enum CONFIG REQUIRED)
find_package(Boost REQUIRED)
find_package(fmt REQUIRED)
find_package(jsoncpp REQUIRED)
#find_package(sol2 REQUIRED)
#find_package(Lua REQUIRED)
#find_package(SDL2 REQUIRED)
#find_package(SDL2-image REQUIRED)
#find_package(SDL2_ttf REQUIRED)
#find_package(SDL2_mixer REQUIRED)
#find_package(unofficial-sqlite3 REQUIRED)

set(Sources textworld.cpp textworld.h)

add_library(textworld ${Sources})
target_compile_features(textworld PUBLIC cxx_std_20)

target_include_directories(textworld 
	PUBLIC 
	${Boost_INCLUDE_DIRS}
	#${LUA_INCLUDE_DIR}
)

target_link_libraries(textworld
	PUBLIC	
	winmm.lib
	bcrypt.lib
	fmt::fmt
	jsoncpp_object jsoncpp_static JsonCpp::JsonCpp
	#${LUA_LIBRARIES}
	#SDL2::SDL2 SDL2::SDL2main SDL2::SDL2-static
	#SDL2::SDL2_image
	#$<IF:$<TARGET_EXISTS:SDL2_ttf::SDL2_ttf>,SDL2_ttf::SDL2_ttf,SDL2_ttf::SDL2_ttf-static>
	#$<IF:$<TARGET_EXISTS:SDL2_mixer::SDL2_mixer>,SDL2_mixer::SDL2_mixer,SDL2_mixer::SDL2_mixer-static>
	#unofficial::sqlite3::sqlite3
)

enable_testing()
add_subdirectory(googletest)
add_subdirectory(textworld-tests)
add_subdirectory(textworld-console)
#add_subdirectory(textworld-gfx)