#include "router.hpp"

#include "board_generator.hpp"
#include "route_metrics.hpp"
#include "routing_graph.hpp"

#include <chrono>

namespace {

using Clock = std::chrono::steady_clock;

/*
 * @brief Computes elapsed milliseconds between two time points.
 *
 * @param start Start time.
 * @param end End time.
 * @return Elapsed milliseconds.
 */
float elapsedMilliseconds(Clock::time_point start, Clock::time_point end) {
    return static_cast<float>(
        std::chrono::duration<double, std::milli>(end - start).count()
    );
}

} // namespace

namespace PCBRouter {

RouteDemoResult computeDemoRoute(float clearance, int seed) {
    const auto startTime = Clock::now();

    const GeneratedBoard board = generateBoard(clearance, seed);
    const RoutePathResult pathResult = findRoute(
        board.expandedObstacles,
        board.pads[0].center,
        board.pads[1].center
    );

    const auto endTime = Clock::now();
    const float runtimeMs = elapsedMilliseconds(startTime, endTime);
    const RouteMetricValues metricValues = computeRouteMetrics(
        pathResult.points,
        pathResult.success,
        runtimeMs
    );

    RouteDemoResult result;

    appendPads(result.pads, board.pads);
    appendPoints(result.routePoints, pathResult.points);
    appendRects(result.obstacles, board.obstacles);
    appendRects(result.expandedObstacles, board.expandedObstacles);
    result.metrics = packMetrics(metricValues);

    result.padCount = static_cast<int>(result.pads.size() / 4);
    result.routePointCount = static_cast<int>(result.routePoints.size() / 2);
    result.obstacleCount = static_cast<int>(result.obstacles.size() / 4);
    result.expandedObstacleCount =
        static_cast<int>(result.expandedObstacles.size() / 4);
    result.metricCount = static_cast<int>(result.metrics.size());

    return result;
}

} // namespace PCBRouter

