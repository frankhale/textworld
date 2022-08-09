cmake_minimum_required(VERSION 3.8)

if(WIN32)
	cmake_policy(SET CMP0091 NEW)
	set(VCPKG_TARGET_TRIPLET "x64-windows-static" CACHE STRING "target triplet" FORCE)
	set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

project(textworld CXX)

enable_testing()
add_subdirectory(googletest)

find_package(magic_enum CONFIG REQUIRED)
find_package(Boost REQUIRED)
find_package(fmt REQUIRED)
#find_package(unofficial-sqlite3 REQUIRED)
#find_package(sol2 REQUIRED)
#find_package(unofficial-lua REQUIRED)

set(Sources textworld.cpp textworld.h)

add_library(textworld ${Sources})
target_compile_features(textworld PUBLIC cxx_std_20)

target_include_directories(textworld PUBLIC ${Boost_INCLUDE_DIRS})
target_link_libraries(textworld
	PUBLIC
	bcrypt.lib
	fmt::fmt
	#lua
	#unofficial::sqlite3::sqlite3
)

add_subdirectory(test)

add_subdirectory(textworld-console)