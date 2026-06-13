cmake_minimum_required(VERSION 3.20)

project(PCBRouterWasm LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(router
    src/board_generator.cpp
    src/route_metrics.cpp
    src/router.cpp
    src/routing_graph.cpp
    wasm/router_module.cpp
)

target_include_directories(router PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/wasm
)

if(EMSCRIPTEN)
    target_compile_options(router PRIVATE
        -O3
        -pthread
        -fexceptions
    )

    target_link_options(router PRIVATE
        "SHELL:-O3"
        "SHELL:--bind"
        "SHELL:-fexceptions"
        "SHELL:-s USE_PTHREADS=0"
        "SHELL:-s MODULARIZE=1"
        "SHELL:-s EXPORT_ES6=1"
        "SHELL:-s ENVIRONMENT=web"
        "SHELL:-s ALLOW_MEMORY_GROWTH=0"
        "SHELL:-s INITIAL_MEMORY=1024MB"
    )
endif()

set_target_properties(router PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/dist
    OUTPUT_NAME router
    SUFFIX ".js"
)

