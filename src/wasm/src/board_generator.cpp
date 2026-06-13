#include "board_generator.hpp"

#include <algorithm>
#include <cstdint>
#include <random>

namespace {

constexpr int RandomDecorativePadCount = 0;

using PCBRouter::BoardHeight;
using PCBRouter::BoardWidth;
using PCBRouter::GeneratedBoard;
using PCBRouter::Pad;
using PCBRouter::Point;
using PCBRouter::Rect;

/*
 * @brief Creates a deterministic random number generator.
 *
 * @param seed Integer seed received from JavaScript.
 * @return Random number generator.
 */
std::mt19937 createGenerator(int seed) {
    const std::uint32_t normalizedSeed = seed > 0
        ? static_cast<std::uint32_t>(seed)
        : 1U;

    return std::mt19937(normalizedSeed);
}

/*
 * @brief Generates a random float in a closed interval.
 *
 * @param generator Random number generator.
 * @param minimum Minimum value.
 * @param maximum Maximum value.
 * @return Random value.
 */
float randomFloat(std::mt19937& generator, float minimum, float maximum) {
    std::uniform_real_distribution<float> distribution(minimum, maximum);

    return distribution(generator);
}

/*
 * @brief Generates a random integer in a closed interval.
 *
 * @param generator Random number generator.
 * @param minimum Minimum value.
 * @param maximum Maximum value.
 * @return Random value.
 */
int randomInt(std::mt19937& generator, int minimum, int maximum) {
    std::uniform_int_distribution<int> distribution(minimum, maximum);

    return distribution(generator);
}

/*
 * @brief Checks whether a rectangle intersects another rectangle.
 *
 * @param first First rectangle.
 * @param second Second rectangle.
 * @return True if the rectangles overlap.
 */
bool intersectsRect(const Rect& first, const Rect& second) {
    return first.x < second.x + second.width
        && first.x + first.width > second.x
        && first.y < second.y + second.height
        && first.y + first.height > second.y;
}

/*
 * @brief Checks whether a rectangle intersects a pad keepout circle.
 *
 * @param rect Rectangle to test.
 * @param pad Pad to test against.
 * @param extraClearance Additional keepout distance.
 * @return True if the rectangle intersects the pad keepout.
 */
bool intersectsPadKeepout(const Rect& rect, const Pad& pad, float extraClearance) {
    const float closestX = std::clamp(
        pad.center.x,
        rect.x,
        rect.x + rect.width
    );
    const float closestY = std::clamp(
        pad.center.y,
        rect.y,
        rect.y + rect.height
    );

    const float dx = pad.center.x - closestX;
    const float dy = pad.center.y - closestY;
    const float radius = pad.radius + extraClearance;

    return dx * dx + dy * dy <= radius * radius;
}

/*
 * @brief Checks whether a candidate obstacle is safe to add.
 *
 * @param candidate Candidate obstacle.
 * @param pads Existing pads.
 * @param obstacles Existing obstacles.
 * @return True if the candidate is usable.
 */
bool isObstacleAllowed(
    const Rect& candidate,
    const std::vector<Pad>& pads,
    const std::vector<Rect>& obstacles
) {
    for (const Pad& pad : pads) {
        if (intersectsPadKeepout(candidate, pad, 90.0F)) {
            return false;
        }
    }

    for (const Rect& obstacle : obstacles) {
        Rect expandedObstacle = {
            obstacle.x - 35.0F,
            obstacle.y - 35.0F,
            obstacle.width + 70.0F,
            obstacle.height + 70.0F,
        };

        if (intersectsRect(candidate, expandedObstacle)) {
            return false;
        }
    }

    return true;
}

/*
 * @brief Creates randomized pads for the demo board.
 *
 * @param generator Random number generator.
 * @return Pad list with two routed pads and decorative pads.
 */
std::vector<Pad> createPads(std::mt19937& generator) {
    std::vector<Pad> pads;
    pads.reserve(RandomDecorativePadCount + 2);

    pads.push_back({
        {160.0F, randomFloat(generator, 130.0F, 360.0F)},
        26.0F,
        1,
    });
    pads.push_back({
        {2840.0F, randomFloat(generator, 1140.0F, 1370.0F)},
        26.0F,
        1,
    });

    for (int i = 0; i < RandomDecorativePadCount; ++i) {
        pads.push_back({
            {
                randomFloat(generator, 340.0F, 2660.0F),
                randomFloat(generator, 180.0F, 1320.0F),
            },
            randomFloat(generator, 15.0F, 24.0F),
            i + 2,
        });
    }

    return pads;
}

/*
 * @brief Creates randomized rectangular board obstacles.
 *
 * @param generator Random number generator.
 * @param pads Pads that obstacles should avoid.
 * @return Random obstacle list.
 */
std::vector<Rect> createObstacles(
    std::mt19937& generator,
    const std::vector<Pad>& pads
) {
    const float countRoll = randomFloat(generator, 0.0F, 1.0F);

    const int obstacleCount = countRoll < 0.03F
        ? 1
        : countRoll < 0.10F
            ? randomInt(generator, 2, 4)
            : countRoll < 0.35F
                ? randomInt(generator, 5, 9)
                : countRoll < 0.80F
                    ? randomInt(generator, 10, 16)
                    : randomInt(generator, 17, 24);

    std::vector<Rect> obstacles;
    obstacles.reserve(obstacleCount);

    int attempts = 0;

    while (
        static_cast<int>(obstacles.size()) < obstacleCount
        && attempts < 1200
    ) {
        ++attempts;

        const float profile = randomFloat(generator, 0.0F, 1.0F);

        const float width = profile < 0.20F
            ? randomFloat(generator, 55.0F, 135.0F)
            : profile < 0.78F
                ? randomFloat(generator, 120.0F, 320.0F)
                : randomFloat(generator, 280.0F, 560.0F);

        const float height = profile < 0.20F
            ? randomFloat(generator, 55.0F, 150.0F)
            : profile < 0.78F
                ? randomFloat(generator, 130.0F, 420.0F)
                : randomFloat(generator, 300.0F, 680.0F);

        const Rect candidate = {
            randomFloat(generator, 300.0F, BoardWidth - width - 300.0F),
            randomFloat(generator, 60.0F, BoardHeight - height - 70.0F),
            width,
            height,
        };

        if (!isObstacleAllowed(candidate, pads, obstacles)) {
            continue;
        }

        obstacles.push_back(candidate);
    }

    return obstacles;
}

/*
 * @brief Expands obstacle rectangles by a clearance amount.
 *
 * @param obstacles Original obstacle rectangles.
 * @param clearance Obstacle expansion distance in board units.
 * @return Expanded rectangular obstacle list.
 */
std::vector<Rect> createExpandedObstacles(
    const std::vector<Rect>& obstacles,
    float clearance
) {
    const float clampedClearance = std::max(0.0F, clearance);

    std::vector<Rect> expandedObstacles;
    expandedObstacles.reserve(obstacles.size());

    for (const Rect& obstacle : obstacles) {
        expandedObstacles.push_back({
            obstacle.x - clampedClearance,
            obstacle.y - clampedClearance,
            obstacle.width + 2.0F * clampedClearance,
            obstacle.height + 2.0F * clampedClearance,
        });
    }

    return expandedObstacles;
}

} // namespace

namespace PCBRouter {

GeneratedBoard generateBoard(float clearance, int seed) {
    std::mt19937 generator = createGenerator(seed);

    GeneratedBoard board;
    board.pads = createPads(generator);
    board.obstacles = createObstacles(generator, board.pads);
    board.expandedObstacles =
        createExpandedObstacles(board.obstacles, clearance);

    return board;
}

} // namespace PCBRouter
