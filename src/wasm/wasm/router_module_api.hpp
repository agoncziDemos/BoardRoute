#pragma once

#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <vector>

#include "../src/router.hpp"

namespace {

/*
 * @brief Most recent native demo route result.
 *
 * This keeps the native vectors alive while JavaScript reads the typed-array
 * views returned by the WASM API.
 */
PCBRouter::RouteDemoResult latestResult;

/*
 * @brief Creates a JavaScript Float32Array view into a native float vector.
 *
 * @param values Native float vector whose memory will be viewed from JavaScript.
 * @return JavaScript Float32Array view backed by WASM memory.
 */
emscripten::val toFloat32MemoryView(const std::vector<float>& values) {
    return emscripten::val(
        emscripten::typed_memory_view(values.size(), values.data())
    );
}

/*
 * @brief Converts the latest native route result into a JavaScript object.
 *
 * @return JavaScript object containing route buffers and route metadata.
 */
emscripten::val toJavaScriptRouteDemoResult() {
    emscripten::val output = emscripten::val::object();

    output.set("padCount", latestResult.padCount);
    output.set("routePointCount", latestResult.routePointCount);
    output.set("obstacleCount", latestResult.obstacleCount);
    output.set("expandedObstacleCount", latestResult.expandedObstacleCount);
    output.set("metricCount", latestResult.metricCount);
    output.set("pads", toFloat32MemoryView(latestResult.pads));
    output.set("routePoints", toFloat32MemoryView(latestResult.routePoints));
    output.set("obstacles", toFloat32MemoryView(latestResult.obstacles));
    output.set(
        "expandedObstacles",
        toFloat32MemoryView(latestResult.expandedObstacles)
    );
    output.set("metrics", toFloat32MemoryView(latestResult.metrics));

    return output;
}

} // namespace

/*
 * @brief Computes the demo route and returns JavaScript views into it.
 *
 * @param clearance Obstacle expansion distance in board units.
 * @param seed Deterministic random seed used to generate the board.
 * @return JavaScript object containing route buffers and metadata.
 */
inline emscripten::val computeDemoRouteFromJavaScript(
    float clearance,
    int seed
) {
    latestResult = PCBRouter::computeDemoRoute(clearance, seed);

    return toJavaScriptRouteDemoResult();
}

