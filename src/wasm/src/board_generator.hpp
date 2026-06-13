#pragma once

#include "board_types.hpp"

#include <vector>

namespace PCBRouter {

/*
 * @brief Generated board data used by the routing demo.
 */
struct GeneratedBoard {
    /*
     * @brief Pads on the generated board.
     *
     * The first two pads belong to the routed net.
     */
    std::vector<Pad> pads;

    /*
     * @brief Obstacle rectangles before clearance expansion.
     */
    std::vector<Rect> obstacles;

    /*
     * @brief Obstacle rectangles after clearance expansion.
     */
    std::vector<Rect> expandedObstacles;
};

/*
 * @brief Generates pads, obstacles, and expanded obstacles for the demo board.
 *
 * @param clearance Obstacle expansion distance in board units.
 * @param seed Deterministic random seed.
 * @return Generated board data.
 */
GeneratedBoard generateBoard(float clearance, int seed);

/*
 * @brief Expands obstacle rectangles by a clearance amount.
 *
 * @param obstacles Original obstacle rectangles.
 * @param clearance Obstacle expansion distance in board units.
 * @return Expanded rectangular obstacle list.
 */
std::vector<Rect> expandObstacles(
    const std::vector<Rect>& obstacles,
    float clearance
);

} // namespace PCBRouter
