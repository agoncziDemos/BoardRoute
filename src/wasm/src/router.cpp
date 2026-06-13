#include "router.hpp"

#include "board_generator.hpp"
#include "route_metrics.hpp"
#include "routing_graph.hpp"

#include <chrono>
#include <cstddef>
#include <vector>

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

/*
 * @brief Reads a flat pad buffer into pad objects.
 *
 * @param values Flat pad buffer with layout x, y, radius, netIndex, ...
 * @return Pad list.
 */
std::vector<PCBRouter::Pad> readPads(const std::vector<float>& values) {
    std::vector<PCBRouter::Pad> pads;

    for (std::size_t i = 0; i + 3 < values.size(); i += 4) {
        pads.push_back({
            {values[i], values[i + 1]},
            values[i + 2],
            static_cast<int>(values[i + 3]),
        });
    }

    return pads;
}

/*
 * @brief Reads a flat rectangle buffer into rectangle objects.
 *
 * @param values Flat rectangle buffer with layout x, y, width, height, ...
 * @return Rectangle list.
 */
std::vector<PCBRouter::Rect> readRects(const std::vector<float>& values) {
    std::vector<PCBRouter::Rect> rects;

    for (std::size_t i = 0; i + 3 < values.size(); i += 4) {
        rects.push_back({
            values[i],
            values[i + 1],
            values[i + 2],
            values[i + 3],
        });
    }

    return rects;
}

/*
 * @brief Builds a route result from parsed board geometry.
 *
 * @param pads Pads to route between.
 * @param obstacles Obstacle rectangles before clearance expansion.
 * @param clearance Obstacle expansion distance in board units.
 * @return Route geometry, pads, obstacles, expanded obstacles, and metrics.
 */
PCBRouter::RouteDemoResult buildRouteResult(
    const std::vector<PCBRouter::Pad>& pads,
    const std::vector<PCBRouter::Rect>& obstacles,
    float clearance
) {
    const auto startTime = Clock::now();
    const std::vector<PCBRouter::Rect> expandedObstacles =
        PCBRouter::expandObstacles(obstacles, clearance);

    PCBRouter::RoutePathResult pathResult;

    if (pads.size() >= 2) {
        pathResult = PCBRouter::findRoute(
            expandedObstacles,
            pads[0].center,
            pads[1].center
        );
    }

    const auto endTime = Clock::now();
    const float runtimeMs = elapsedMilliseconds(startTime, endTime);
    const PCBRouter::RouteMetricValues metricValues =
        PCBRouter::computeRouteMetrics(
            pathResult.points,
            pathResult.success,
            runtimeMs
        );

    PCBRouter::RouteDemoResult result;

    PCBRouter::appendPads(result.pads, pads);
    PCBRouter::appendPoints(result.routePoints, pathResult.points);
    PCBRouter::appendRects(result.obstacles, obstacles);
    PCBRouter::appendRects(result.expandedObstacles, expandedObstacles);
    result.metrics = PCBRouter::packMetrics(metricValues);

    result.padCount = static_cast<int>(result.pads.size() / 4);
    result.routePointCount = static_cast<int>(result.routePoints.size() / 2);
    result.obstacleCount = static_cast<int>(result.obstacles.size() / 4);
    result.expandedObstacleCount =
        static_cast<int>(result.expandedObstacles.size() / 4);
    result.metricCount = static_cast<int>(result.metrics.size());

    return result;
}

} // namespace

namespace PCBRouter {

RouteDemoResult routeBoard(
    const std::vector<float>& pads,
    const std::vector<float>& obstacles,
    float clearance
) {
    return buildRouteResult(
        readPads(pads),
        readRects(obstacles),
        clearance
    );
}

RouteDemoResult computeDemoRoute(float clearance, int seed) {
    const GeneratedBoard board = generateBoard(clearance, seed);

    return buildRouteResult(
        board.pads,
        board.obstacles,
        clearance
    );
}

} // namespace PCBRouter
