#include "routing_graph.hpp"

#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/astar_search.hpp>
#include <boost/graph/properties.hpp>

#include <algorithm>
#include <cmath>
#include <limits>
#include <vector>

namespace {

using PCBRouter::GridHeight;
using PCBRouter::GridPoint;
using PCBRouter::GridSize;
using PCBRouter::GridWidth;
using PCBRouter::Point;
using PCBRouter::Rect;
using PCBRouter::RoutePathResult;
using PCBRouter::TotalGridCells;

using Graph = boost::adjacency_list<
    boost::vecS,
    boost::vecS,
    boost::undirectedS,
    boost::no_property,
    boost::property<boost::edge_weight_t, float>
>;

using Vertex = boost::graph_traits<Graph>::vertex_descriptor;

struct FoundGoalException {};

struct GridSearchResult {
    bool success = false;
    std::vector<GridPoint> path;
};

/*
 * @brief Converts a grid coordinate into a flattened grid index.
 *
 * @param point Grid coordinate.
 * @return Flattened grid index.
 */
int toIndex(const GridPoint& point) {
    return point.row * GridWidth + point.column;
}

/*
 * @brief Converts a flattened grid index into a grid coordinate.
 *
 * @param index Flattened grid index.
 * @return Grid coordinate.
 */
GridPoint toGridPoint(int index) {
    return {
        index % GridWidth,
        index / GridWidth,
    };
}

/*
 * @brief Converts a world-space point into the nearest grid coordinate.
 *
 * @param point World-space point.
 * @return Nearest grid coordinate.
 */
GridPoint toGridPoint(const Point& point) {
    const int column = static_cast<int>(
        std::round(point.x / static_cast<float>(GridSize))
    );
    const int row = static_cast<int>(
        std::round(point.y / static_cast<float>(GridSize))
    );

    return {
        std::clamp(column, 0, GridWidth - 1),
        std::clamp(row, 0, GridHeight - 1),
    };
}

/*
 * @brief Converts a grid coordinate into a world-space point.
 *
 * @param point Grid coordinate.
 * @return World-space point.
 */
Point toPoint(const GridPoint& point) {
    return {
        static_cast<float>(point.column * GridSize),
        static_cast<float>(point.row * GridSize),
    };
}

/*
 * @brief Checks whether a grid coordinate is inside the board grid.
 *
 * @param point Grid coordinate.
 * @return True if the coordinate is inside the board grid.
 */
bool isInsideGrid(const GridPoint& point) {
    return point.column >= 0
        && point.column < GridWidth
        && point.row >= 0
        && point.row < GridHeight;
}

/*
 * @brief Checks whether a world-space point lies inside a rectangle.
 *
 * @param point World-space point.
 * @param rect Rectangle.
 * @return True if the point is inside or on the rectangle boundary.
 */
bool isInsideRect(const Point& point, const Rect& rect) {
    return point.x >= rect.x
        && point.x <= rect.x + rect.width
        && point.y >= rect.y
        && point.y <= rect.y + rect.height;
}

/*
 * @brief Builds a blocked-cell map from expanded obstacle rectangles.
 *
 * @param expandedObstacles Expanded obstacle rectangles.
 * @param start Start coordinate, forced unblocked.
 * @param goal Goal coordinate, forced unblocked.
 * @return Blocked-cell map.
 */
std::vector<bool> buildBlockedCells(
    const std::vector<Rect>& expandedObstacles,
    const GridPoint& start,
    const GridPoint& goal
) {
    std::vector<bool> blocked(TotalGridCells, false);

    for (int row = 0; row < GridHeight; ++row) {
        for (int column = 0; column < GridWidth; ++column) {
            const GridPoint gridPoint = {column, row};
            const Point point = toPoint(gridPoint);

            for (const Rect& rect : expandedObstacles) {
                if (isInsideRect(point, rect)) {
                    blocked[toIndex(gridPoint)] = true;
                    break;
                }
            }
        }
    }

    blocked[toIndex(start)] = false;
    blocked[toIndex(goal)] = false;

    return blocked;
}

/*
 * @brief Adds one weighted graph edge between two neighboring grid cells.
 *
 * @param graph Routing graph.
 * @param source Source grid coordinate.
 * @param target Target grid coordinate.
 * @param blocked Blocked-cell map.
 */
void addRoutingEdge(
    Graph& graph,
    const GridPoint& source,
    const GridPoint& target,
    const std::vector<bool>& blocked
) {
    if (!isInsideGrid(target)) {
        return;
    }

    const int sourceIndex = toIndex(source);
    const int targetIndex = toIndex(target);

    if (blocked[sourceIndex] || blocked[targetIndex]) {
        return;
    }

    boost::add_edge(
        static_cast<Vertex>(sourceIndex),
        static_cast<Vertex>(targetIndex),
        1.0F,
        graph
    );
}

/*
 * @brief Builds a Boost.Graph routing graph from the blocked-cell map.
 *
 * @param blocked Blocked-cell map.
 * @return Routing graph with one vertex per grid cell.
 */
Graph buildRoutingGraph(const std::vector<bool>& blocked) {
    Graph graph(TotalGridCells);

    for (int row = 0; row < GridHeight; ++row) {
        for (int column = 0; column < GridWidth; ++column) {
            const GridPoint source = {column, row};

            addRoutingEdge(graph, source, {column + 1, row}, blocked);
            addRoutingEdge(graph, source, {column, row + 1}, blocked);
        }
    }

    return graph;
}

/*
 * @brief A* heuristic for estimating grid distance to the goal.
 */
class ManhattanHeuristic : public boost::astar_heuristic<Graph, float> {
public:
    /*
     * @brief Creates a Manhattan-distance heuristic toward a fixed goal.
     *
     * @param goal Goal grid coordinate.
     */
    explicit ManhattanHeuristic(GridPoint goal)
        : goal_(goal) {}

    /*
     * @brief Estimates remaining path cost from a graph vertex to the goal.
     *
     * @param vertex Graph vertex representing a grid cell.
     * @return Estimated remaining cost.
     */
    float operator()(Vertex vertex) const {
        const GridPoint point = toGridPoint(static_cast<int>(vertex));

        return static_cast<float>(
            std::abs(point.column - goal_.column)
            + std::abs(point.row - goal_.row)
        );
    }

private:
    GridPoint goal_;
};

/*
 * @brief A* visitor that stops the Boost.Graph search when the goal is reached.
 */
class GoalVisitor : public boost::default_astar_visitor {
public:
    /*
     * @brief Creates a visitor for a fixed goal vertex.
     *
     * @param goal Goal vertex.
     */
    explicit GoalVisitor(Vertex goal)
        : goal_(goal) {}

    /*
     * @brief Called by Boost.Graph when a vertex is examined.
     *
     * @param vertex Current vertex.
     * @param graph Search graph.
     */
    void examine_vertex(Vertex vertex, const Graph& graph) {
        (void)graph;

        if (vertex == goal_) {
            throw FoundGoalException();
        }
    }

private:
    Vertex goal_;
};

/*
 * @brief Reconstructs a grid path from a Boost.Graph predecessor map.
 *
 * @param predecessors Predecessor vertex map.
 * @param start Start grid coordinate.
 * @param goal Goal grid coordinate.
 * @return Full grid path from start to goal.
 */
std::vector<GridPoint> reconstructPath(
    const std::vector<Vertex>& predecessors,
    const GridPoint& start,
    const GridPoint& goal
) {
    const Vertex startVertex = static_cast<Vertex>(toIndex(start));
    const Vertex goalVertex = static_cast<Vertex>(toIndex(goal));

    std::vector<GridPoint> path;
    Vertex current = goalVertex;

    while (current != startVertex) {
        path.push_back(toGridPoint(static_cast<int>(current)));
        current = predecessors[current];
    }

    path.push_back(start);
    std::reverse(path.begin(), path.end());

    return path;
}

/*
 * @brief Runs Boost.Graph A* search on the routing graph.
 *
 * @param graph Routing graph.
 * @param start Start grid coordinate.
 * @param goal Goal grid coordinate.
 * @return Search result containing success flag and grid path.
 */
GridSearchResult searchRouteWithBoostGraph(
    const Graph& graph,
    const GridPoint& start,
    const GridPoint& goal
) {
    const Vertex startVertex = static_cast<Vertex>(toIndex(start));
    const Vertex goalVertex = static_cast<Vertex>(toIndex(goal));

    std::vector<Vertex> predecessors(TotalGridCells);
    std::vector<float> distances(
        TotalGridCells,
        std::numeric_limits<float>::max()
    );

    for (int i = 0; i < TotalGridCells; ++i) {
        predecessors[i] = static_cast<Vertex>(i);
    }

    try {
        boost::astar_search(
            graph,
            startVertex,
            ManhattanHeuristic(goal),
            boost::predecessor_map(predecessors.data())
                .distance_map(distances.data())
                .weight_map(boost::get(boost::edge_weight, graph))
                .visitor(GoalVisitor(goalVertex))
        );
    } catch (const FoundGoalException&) {
        return {
            true,
            reconstructPath(predecessors, start, goal),
        };
    }

    return {};
}

/*
 * @brief Removes unnecessary intermediate points from an axis-aligned grid path.
 *
 * @param path Full grid path.
 * @return Compressed grid path with only endpoints and bend points.
 */
std::vector<GridPoint> compressPath(const std::vector<GridPoint>& path) {
    if (path.size() <= 2) {
        return path;
    }

    std::vector<GridPoint> compressed;
    compressed.push_back(path.front());

    int previousColumnDirection = path[1].column - path[0].column;
    int previousRowDirection = path[1].row - path[0].row;

    for (std::size_t i = 2; i < path.size(); ++i) {
        const int columnDirection = path[i].column - path[i - 1].column;
        const int rowDirection = path[i].row - path[i - 1].row;

        if (
            columnDirection != previousColumnDirection
            || rowDirection != previousRowDirection
        ) {
            compressed.push_back(path[i - 1]);
            previousColumnDirection = columnDirection;
            previousRowDirection = rowDirection;
        }
    }

    compressed.push_back(path.back());

    return compressed;
}

/*
 * @brief Converts a compressed grid path into world-space route points.
 *
 * @param path Compressed grid path.
 * @return World-space route points.
 */
std::vector<Point> toRoutePoints(const std::vector<GridPoint>& path) {
    std::vector<Point> routePoints;

    for (const GridPoint& gridPoint : path) {
        routePoints.push_back(toPoint(gridPoint));
    }

    return routePoints;
}

} // namespace

namespace PCBRouter {

RoutePathResult findRoute(
    const std::vector<Rect>& expandedObstacles,
    const Point& startPoint,
    const Point& goalPoint
) {
    const GridPoint start = toGridPoint(startPoint);
    const GridPoint goal = toGridPoint(goalPoint);
    const std::vector<bool> blocked =
        buildBlockedCells(expandedObstacles, start, goal);
    const Graph graph = buildRoutingGraph(blocked);
    const GridSearchResult searchResult =
        searchRouteWithBoostGraph(graph, start, goal);

    RoutePathResult result;
    result.success = searchResult.success;

    if (!searchResult.success) {
        result.points = {
            startPoint,
            goalPoint,
        };

        return result;
    }

    result.points = toRoutePoints(compressPath(searchResult.path));

    return result;
}

} // namespace PCBRouter


