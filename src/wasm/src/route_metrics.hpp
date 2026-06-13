#pragma once

#include "board_types.hpp"

#include <vector>

namespace PCBRouter {

/*
 * @brief Computed route metric values.
 */
struct RouteMetricValues {
    /*
     * @brief Whether the route succeeded.
     */
    bool success = false;

    /*
     * @brief Route score.
     *
     * Lower scores are better.
     */
    float score = 0.0F;

    /*
     * @brief Total route length in board units.
     */
    float length = 0.0F;

    /*
     * @brief Number of route bends.
     */
    int bends = 0;

    /*
     * @brief Number of vias used by the route.
     *
     * The current demo is single-layer, so this remains zero.
     */
    int vias = 0;

    /*
     * @brief Number of route violations.
     */
    int violations = 0;

    /*
     * @brief C++ routing runtime in milliseconds.
     */
    float runtimeMs = 0.0F;
};

/*
 * @brief Computes route metrics from route geometry and runtime.
 *
 * @param points World-space route points.
 * @param routeSucceeded Whether the route succeeded.
 * @param runtimeMs C++ routing runtime in milliseconds.
 * @return Computed metric values.
 */
RouteMetricValues computeRouteMetrics(
    const std::vector<Point>& points,
    bool routeSucceeded,
    float runtimeMs
);

/*
 * @brief Appends pads to a flat float buffer.
 *
 * @param buffer Destination float buffer.
 * @param pads Pads to append.
 */
void appendPads(std::vector<float>& buffer, const std::vector<Pad>& pads);

/*
 * @brief Appends points to a flat float buffer.
 *
 * @param buffer Destination float buffer.
 * @param points Points to append.
 */
void appendPoints(std::vector<float>& buffer, const std::vector<Point>& points);

/*
 * @brief Appends rectangles to a flat float buffer.
 *
 * @param buffer Destination float buffer.
 * @param rectangles Rectangles to append.
 */
void appendRects(
    std::vector<float>& buffer,
    const std::vector<Rect>& rectangles
);

/*
 * @brief Converts route metrics into the flat metrics buffer used by JavaScript.
 *
 * @param metrics Metric values.
 * @return Flat metrics buffer.
 */
std::vector<float> packMetrics(const RouteMetricValues& metrics);

} // namespace PCBRouter

