cmake_minimum_required(VERSION 3.8)

set(textworld-gfx CXX)
set(Sources main.cpp)

file(COPY ${CMAKE_CURRENT_SOURCE_DIR}/assets/ DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/assets/)

add_executable(textworld-gfx ${Sources})
target_compile_features(textworld-gfx PUBLIC cxx_std_20)

target_link_libraries(textworld-gfx
    PRIVATE
    textworld
)