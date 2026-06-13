#pragma once

#include <vector>

namespace PCBRouter {

/*
 * @brief Result data returned through the WASM routing API.
 */
struct RouteDemoResult {
    /*
     * @brief Number of pad records stored in pads.
     *
     * The pads buffer stores four float values per pad:
     * x, y, radius, netIndex.
     */
    int padCount = 0;

    /*
     * @brief Number of route points stored in routePoints.
     *
     * The routePoints buffer stores two float values per point: x, y.
     */
    int routePointCount = 0;

    /*
     * @brief Number of obstacle rectangles stored in obstacles.
     *
     * The obstacles buffer stores four float values per rectangle:
     * x, y, width, height.
     */
    int obstacleCount = 0;

    /*
     * @brief Number of expanded obstacle rectangles stored in expandedObstacles.
     *
     * The expandedObstacles buffer stores four float values per rectangle:
     * x, y, width, height.
     */
    int expandedObstacleCount = 0;

    /*
     * @brief Number of metric values stored in metrics.
     *
     * Layout: success, score, length, bends, vias, violations, runtimeMs.
     */
    int metricCount = 0;

    /*
     * @brief Flat pad buffer.
     *
     * Layout: x, y, radius, netIndex, ...
     */
    std::vector<float> pads;

    /*
     * @brief Flat route point buffer.
     *
     * Layout: x0, y0, x1, y1, ...
     */
    std::vector<float> routePoints;

    /*
     * @brief Flat obstacle rectangle buffer.
     *
     * Layout: x, y, width, height, ...
     */
    std::vector<float> obstacles;

    /*
     * @brief Flat expanded obstacle rectangle buffer.
     *
     * Layout: x, y, width, height, ...
     */
    std::vector<float> expandedObstacles;

    /*
     * @brief Flat route metrics buffer.
     *
     * Layout: success, score, length, bends, vias, violations, runtimeMs.
     */
    std::vector<float> metrics;
};

/*
 * @brief Routes caller-provided board geometry.
 *
 * @param pads Flat pad buffer with layout x, y, radius, netIndex, ...
 * @param obstacles Flat obstacle buffer with layout x, y, width, height, ...
 * @param clearance Obstacle expansion distance in board units.
 * @return Route geometry, pads, obstacles, expanded obstacles, and metrics.
 */
RouteDemoResult routeBoard(
    const std::vector<float>& pads,
    const std::vector<float>& obstacles,
    float clearance
);

/*
 * @brief Computes a demo route using a generated board and Boost.Graph A*.
 *
 * @param clearance Obstacle expansion distance in board units.
 * @param seed Deterministic random seed used to generate the board.
 * @return Route geometry, pads, obstacles, expanded obstacles, and metrics.
 */
RouteDemoResult computeDemoRoute(float clearance, int seed);

} // namespace PCBRouter
