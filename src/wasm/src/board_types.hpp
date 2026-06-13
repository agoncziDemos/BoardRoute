#pragma once

#include <vector>

namespace PCBRouter {

/*
 * @brief Board width in world-space units.
 */
inline constexpr int BoardWidth = 3000;

/*
 * @brief Board height in world-space units.
 */
inline constexpr int BoardHeight = 1500;

/*
 * @brief Grid cell size in world-space units.
 */
inline constexpr int GridSize = 10;

/*
 * @brief Number of grid columns.
 */
inline constexpr int GridWidth = BoardWidth / GridSize + 1;

/*
 * @brief Number of grid rows.
 */
inline constexpr int GridHeight = BoardHeight / GridSize + 1;

/*
 * @brief Total number of grid cells.
 */
inline constexpr int TotalGridCells = GridWidth * GridHeight;

/*
 * @brief Two-dimensional world-space point.
 */
struct Point {
    /*
     * @brief Horizontal coordinate in board units.
     */
    float x = 0.0F;

    /*
     * @brief Vertical coordinate in board units.
     */
    float y = 0.0F;
};

/*
 * @brief Integer coordinate on the routing grid.
 */
struct GridPoint {
    /*
     * @brief Grid column index.
     */
    int column = 0;

    /*
     * @brief Grid row index.
     */
    int row = 0;
};

/*
 * @brief Axis-aligned rectangle in board space.
 */
struct Rect {
    /*
     * @brief Left edge position in board units.
     */
    float x = 0.0F;

    /*
     * @brief Top edge position in board units.
     */
    float y = 0.0F;

    /*
     * @brief Rectangle width in board units.
     */
    float width = 0.0F;

    /*
     * @brief Rectangle height in board units.
     */
    float height = 0.0F;
};

/*
 * @brief Circular PCB pad used by the demo board.
 */
struct Pad {
    /*
     * @brief Pad center position.
     */
    Point center;

    /*
     * @brief Pad radius in board units.
     */
    float radius = 0.0F;

    /*
     * @brief Numeric net identifier used by the TypeScript adapter.
     */
    int netIndex = 0;
};

} // namespace PCBRouter

