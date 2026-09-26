cmake_minimum_required(VERSION 3.16)
project(netraverse_service LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(PkgConfig REQUIRED)
pkg_check_modules(PCAP REQUIRED IMPORTED_TARGET libpcap)

add_executable(netraverse
    src/main.cpp
    src/packet_capture.cpp
    src/flow_tracker.cpp
    src/alert.cpp
)

target_include_directories(netraverse PRIVATE include)
target_link_libraries(netraverse PRIVATE PkgConfig::PCAP)

target_compile_options(netraverse PRIVATE
    -Wall
    -Wextra
    -Wpedantic
)