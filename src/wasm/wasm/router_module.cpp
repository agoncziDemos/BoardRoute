#include <emscripten/bind.h>

#include "router_module_api.hpp"

EMSCRIPTEN_BINDINGS(router_module) {
    emscripten::function(
        "computeDemoRoute",
        &computeDemoRouteFromJavaScript
    );
    emscripten::function(
        "routeBoard",
        &routeBoardFromJavaScript
    );
}
