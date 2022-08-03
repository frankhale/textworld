cmake_minimum_required(VERSION 3.8)

set(textworld-test)
set(Sources test.cpp)

add_executable(textworld-test ${Sources})

target_link_libraries(textworld-test
    PUBLIC
    gtest_main
    textworld
)

add_test(
    NAME textworld-test
    COMMAND textworld-test
)