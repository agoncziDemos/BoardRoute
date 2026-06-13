import type { DemoBoard, Point, Rect } from "../../routing/routeTypes";
import {
  MinimumObstacleSize,
  type ResizeHandle,
} from "./boardInteractionTypes";

export type BoardTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export function getBoardTransform(
  canvasWidth: number,
  canvasHeight: number,
  board: DemoBoard,
): BoardTransform {
  const margin = 32;
  const scale = Math.min(
    (canvasWidth - 2 * margin) / board.width,
    (canvasHeight - 2 * margin) / board.height,
  );

  return {
    scale,
    offsetX: (canvasWidth - board.width * scale) / 2,
    offsetY: (canvasHeight - board.height * scale) / 2,
  };
}

export function toCanvas(point: Point, transform: BoardTransform): Point {
  return {
    x: transform.offsetX + point.x * transform.scale,
    y: transform.offsetY + point.y * transform.scale,
  };
}

export function fromCanvas(point: Point, transform: BoardTransform): Point {
  return {
    x: (point.x - transform.offsetX) / transform.scale,
    y: (point.y - transform.offsetY) / transform.scale,
  };
}

export function rectToCanvas(rect: Rect, transform: BoardTransform): Rect {
  return {
    x: transform.offsetX + rect.x * transform.scale,
    y: transform.offsetY + rect.y * transform.scale,
    width: rect.width * transform.scale,
    height: rect.height * transform.scale,
  };
}

export function clampPointToBoard(
  point: Point,
  board: DemoBoard,
  radius: number,
): Point {
  return {
    x: clamp(point.x, radius, board.width - radius),
    y: clamp(point.y, radius, board.height - radius),
  };
}

export function clampRectToBoard(rect: Rect, board: DemoBoard): Rect {
  return {
    ...rect,
    x: clamp(rect.x, 0, board.width - rect.width),
    y: clamp(rect.y, 0, board.height - rect.height),
  };
}

export function resizeRectFromHandle(
  rect: Rect,
  handle: ResizeHandle,
  delta: Point,
  board: DemoBoard,
): Rect {
  const startLeft = rect.x;
  const startTop = rect.y;
  const startRight = rect.x + rect.width;
  const startBottom = rect.y + rect.height;

  let left = startLeft;
  let top = startTop;
  let right = startRight;
  let bottom = startBottom;

  if (handle === "nw" || handle === "sw") {
    left = clamp(startLeft + delta.x, 0, startRight - MinimumObstacleSize);
  }

  if (handle === "ne" || handle === "se") {
    right = clamp(
      startRight + delta.x,
      startLeft + MinimumObstacleSize,
      board.width,
    );
  }

  if (handle === "nw" || handle === "ne") {
    top = clamp(startTop + delta.y, 0, startBottom - MinimumObstacleSize);
  }

  if (handle === "sw" || handle === "se") {
    bottom = clamp(
      startBottom + delta.y,
      startTop + MinimumObstacleSize,
      board.height,
    );
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
