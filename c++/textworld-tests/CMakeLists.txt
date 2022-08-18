cmake_minimum_required(VERSION 3.8)

set(textworld-tests CXX)
set(Sources tests.cpp)

add_executable(textworld-tests ${Sources})
target_compile_features(textworld-tests PUBLIC cxx_std_20)

target_link_libraries(textworld-tests
    PRIVATE
    gtest_main
    textworld
)
