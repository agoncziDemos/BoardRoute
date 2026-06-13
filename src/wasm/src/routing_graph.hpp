#pragma once

#include "board_types.hpp"

#include <vector>

namespace PCBRouter {

/*
 * @brief Result of routing between two pads.
 */
struct RoutePathResult {
    /*
     * @brief Whether a valid path was found.
     */
    bool success = false;

    /*
     * @brief World-space route points.
     *
     * The path is compressed to endpoints and bend points.
     */
    std::vector<Point> points;
};

/*
 * @brief Finds a route between two world-space points using a Boost.Graph grid.
 *
 * @param expandedObstacles Clearance-expanded obstacle rectangles.
 * @param startPoint Route start point.
 * @param goalPoint Route goal point.
 * @return Route path result.
 */
RoutePathResult findRoute(
    const std::vector<Rect>& expandedObstacles,
    const Point& startPoint,
    const Point& goalPoint
);

} // namespace PCBRouter

