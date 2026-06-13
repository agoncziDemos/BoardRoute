import type { Point, Rect } from "../../routing/routeTypes";

export type EditablePadId = "P1" | "P2";
export type ResizeHandle = "nw" | "ne" | "sw" | "se";

export type CanvasCursor =
  | "default"
  | "pointer"
  | "grab"
  | "grabbing"
  | "crosshair"
  | "nwse-resize"
  | "nesw-resize";

export type DragState =
  | {
      kind: "pad";
      padId: EditablePadId;
    }
  | {
      kind: "obstacle";
      obstacleIndex: number;
      startPoint: Point;
      startRect: Rect;
    }
  | {
      kind: "resize";
      obstacleIndex: number;
      handle: ResizeHandle;
      startPoint: Point;
      startRect: Rect;
    };

export const MinimumObstacleSize = 40;
export const ResizeHandleHitRadius = 45;
export const ResizeHandleDrawSize = 10;
