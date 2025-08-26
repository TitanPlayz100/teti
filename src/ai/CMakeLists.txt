cmake_minimum_required(VERSION 3.11)
cmake_policy(SET CMP0015 NEW)

include(FetchContent)

FetchContent_Declare(json
  GIT_REPOSITORY https://github.com/ArthurSonzogni/nlohmann_json_cmake_fetchcontent
  GIT_TAG v3.10.4)

project(MisaMinoTBP)

set(CMAKE_VERBOSE_MAKEFILE on)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build.emscripten)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3") # -O3 
option(TBP_ASYNC "use asyncify" ON) #OFF


file(GLOB_RECURSE CORE_HDR tetris_ai/*.h)
file(GLOB_RECURSE CORE_SRC tetris_ai/*.cpp)

#
# Trying usual cmake project compiler execution
#

add_definitions("-std=c++11")

FetchContent_GetProperties(json)
if(NOT json_POPULATED)
  FetchContent_Populate(json)
  add_subdirectory(${json_SOURCE_DIR} ${json_BINARY_DIR} EXCLUDE_FROM_ALL)
endif()


add_executable(misamino ${CORE_SRC} ${CORE_HDR})
target_link_libraries(misamino PRIVATE nlohmann_json::nlohmann_json)

# ENABLE DEBUG MSGs
#target_compile_definitions(misamino PRIVATE BOT_DEBUG=1)
target_compile_definitions(misamino PRIVATE BOT_VERSION="v1.0.1")
target_compile_definitions(misamino PRIVATE BOT_NAME="MisaMino")

set_property(
    TARGET misamino
    APPEND_STRING PROPERTY
        LINK_FLAGS " -s DEMANGLE_SUPPORT=1 -s ALLOW_MEMORY_GROWTH=1 -s NO_DISABLE_EXCEPTION_CATCHING -s EXPORTED_FUNCTIONS='[\"_tbp_msg\",\"_main\"]' -s EXPORTED_RUNTIME_METHODS='[\"ccall\",\"cwrap\"]' --bind"
)

if(TBP_ASYNC)
    target_compile_definitions(misamino PRIVATE TBP_ASYNC=1)
    target_compile_definitions(misamino PRIVATE TBP_ASYNC_NODES=1000)
    set_property(
        TARGET misamino
        APPEND_STRING PROPERTY
            LINK_FLAGS " -s ASYNCIFY -s ASYNCIFY_IGNORE_INDIRECT -s ASYNCIFY_ADVISE " #-s ASYNCIFY_IGNORE_INDIRECT -s ASYNCIFY_ADVISE
    )
endif()


