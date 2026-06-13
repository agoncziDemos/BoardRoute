import type { DemoBoard, Point } from "../../routing/routeTypes";
import {
  ResizeHandleHitRadius,
  type CanvasCursor,
  type EditablePadId,
  type ResizeHandle,
} from "./boardInteractionTypes";

export function findEditablePadHit(
  board: DemoBoard,
  point: Point,
): EditablePadId | null {
  let bestPadId: EditablePadId | null = null;
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  for (const pad of board.pads) {
    const editablePadId = getEditablePadId(pad.id);

    if (editablePadId === null) {
      continue;
    }

    const dx = point.x - pad.center.x;
    const dy = point.y - pad.center.y;
    const distanceSquared = dx * dx + dy * dy;
    const hitRadius = pad.radius + 35;
    const hitRadiusSquared = hitRadius * hitRadius;

    if (
      distanceSquared <= hitRadiusSquared &&
      distanceSquared < bestDistanceSquared
    ) {
      bestPadId = editablePadId;
      bestDistanceSquared = distanceSquared;
    }
  }

  return bestPadId;
}

export function findObstacleHit(board: DemoBoard, point: Point): number | null {
  for (let index = board.obstacles.length - 1; index >= 0; --index) {
    const obstacle = board.obstacles[index];

    if (
      point.x >= obstacle.x &&
      point.x <= obstacle.x + obstacle.width &&
      point.y >= obstacle.y &&
      point.y <= obstacle.y + obstacle.height
    ) {
      return index;
    }
  }

  return null;
}

export function findResizeHandleHit(
  board: DemoBoard,
  point: Point,
  selectedObstacleIndex: number | null,
): ResizeHandle | null {
  if (selectedObstacleIndex === null) {
    return null;
  }

  const obstacle = board.obstacles[selectedObstacleIndex];

  if (obstacle === undefined) {
    return null;
  }

  const corners: { handle: ResizeHandle; point: Point }[] = [
    {
      handle: "nw",
      point: {
        x: obstacle.x,
        y: obstacle.y,
      },
    },
    {
      handle: "ne",
      point: {
        x: obstacle.x + obstacle.width,
        y: obstacle.y,
      },
    },
    {
      handle: "sw",
      point: {
        x: obstacle.x,
        y: obstacle.y + obstacle.height,
      },
    },
    {
      handle: "se",
      point: {
        x: obstacle.x + obstacle.width,
        y: obstacle.y + obstacle.height,
      },
    },
  ];

  let bestHandle: ResizeHandle | null = null;
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  for (const corner of corners) {
    const dx = point.x - corner.point.x;
    const dy = point.y - corner.point.y;
    const distanceSquared = dx * dx + dy * dy;

    if (
      distanceSquared <= ResizeHandleHitRadius * ResizeHandleHitRadius &&
      distanceSquared < bestDistanceSquared
    ) {
      bestHandle = corner.handle;
      bestDistanceSquared = distanceSquared;
    }
  }

  return bestHandle;
}

export function getResizeCursor(handle: ResizeHandle): CanvasCursor {
  return handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize";
}

function getEditablePadId(id: string): EditablePadId | null {
  if (id === "P1" || id === "P2") {
    return id;
  }

  return null;
}
