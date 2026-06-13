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
     * The first two pads belong to the routed net. Remaining pads are
     * decorative components that make the board look denser.
     */
    std::vector<Pad> pads;

    /*
     * @brief Component obstacle rectangles before clearance expansion.
     */
    std::vector<Rect> obstacles;

    /*
     * @brief Component obstacle rectangles after clearance expansion.
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

} // namespace PCBRouter

