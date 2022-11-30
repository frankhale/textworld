cmake_minimum_required(VERSION 3.8)

set(textworld-console CXX)
set(Sources main.cpp)

add_executable(textworld-console ${Sources})
target_compile_features(textworld-console PUBLIC cxx_std_20)

target_link_libraries(textworld-console
    PRIVATE
    textworld
)