#include "route_metrics.hpp"

#include <cmath>
#include <cstddef>

namespace {

/*
 * @brief Computes Euclidean distance between two points.
 *
 * @param first First point.
 * @param second Second point.
 * @return Distance in board units.
 */
float distance(const PCBRouter::Point& first, const PCBRouter::Point& second) {
    const float dx = first.x - second.x;
    const float dy = first.y - second.y;

    return std::sqrt(dx * dx + dy * dy);
}

} // namespace

namespace PCBRouter {

RouteMetricValues computeRouteMetrics(
    const std::vector<Point>& points,
    bool routeSucceeded,
    float runtimeMs
) {
    float length = 0.0F;
    int bends = 0;

    for (std::size_t i = 1; i < points.size(); ++i) {
        length += distance(points[i - 1], points[i]);
    }

    for (std::size_t i = 2; i < points.size(); ++i) {
        const float dx0 = points[i - 1].x - points[i - 2].x;
        const float dy0 = points[i - 1].y - points[i - 2].y;
        const float dx1 = points[i].x - points[i - 1].x;
        const float dy1 = points[i].y - points[i - 1].y;

        const int sx0 = (dx0 > 0.0F) - (dx0 < 0.0F);
        const int sy0 = (dy0 > 0.0F) - (dy0 < 0.0F);
        const int sx1 = (dx1 > 0.0F) - (dx1 < 0.0F);
        const int sy1 = (dy1 > 0.0F) - (dy1 < 0.0F);

        if (sx0 != sx1 || sy0 != sy1) {
            ++bends;
        }
    }

    RouteMetricValues metrics;
    metrics.success = routeSucceeded;
    metrics.length = length;
    metrics.bends = bends;
    metrics.vias = 0;
    metrics.violations = routeSucceeded ? 0 : 1;
    metrics.score = routeSucceeded
        ? length + static_cast<float>(bends) * 60.0F
        : 999999.0F;
    metrics.runtimeMs = runtimeMs;

    return metrics;
}

void appendPads(std::vector<float>& buffer, const std::vector<Pad>& pads) {
    for (const Pad& pad : pads) {
        buffer.push_back(pad.center.x);
        buffer.push_back(pad.center.y);
        buffer.push_back(pad.radius);
        buffer.push_back(static_cast<float>(pad.netIndex));
    }
}

void appendPoints(
    std::vector<float>& buffer,
    const std::vector<Point>& points
) {
    for (const Point& point : points) {
        buffer.push_back(point.x);
        buffer.push_back(point.y);
    }
}

void appendRects(
    std::vector<float>& buffer,
    const std::vector<Rect>& rectangles
) {
    for (const Rect& rect : rectangles) {
        buffer.push_back(rect.x);
        buffer.push_back(rect.y);
        buffer.push_back(rect.width);
        buffer.push_back(rect.height);
    }
}

std::vector<float> packMetrics(const RouteMetricValues& metrics) {
    return {
        metrics.success ? 1.0F : 0.0F,
        metrics.score,
        metrics.length,
        static_cast<float>(metrics.bends),
        static_cast<float>(metrics.vias),
        static_cast<float>(metrics.violations),
        metrics.runtimeMs,
    };
}

} // namespace PCBRouter

