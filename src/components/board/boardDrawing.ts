import type { DemoBoard, Point, Rect, RouteResult } from "../../routing/routeTypes";
import {
  getBoardTransform,
  rectToCanvas,
  toCanvas,
  type BoardTransform,
} from "./boardGeometry";
import { ResizeHandleDrawSize } from "./boardInteractionTypes";

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  board: DemoBoard,
  route: RouteResult,
  selectedObstacleIndex: number | null,
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const transform = getBoardTransform(canvasWidth, canvasHeight, board);

  drawBackground(ctx, canvasWidth, canvasHeight);
  drawBoardFill(ctx, board, transform);
  drawGrid(ctx, board, transform, 10);
  drawExpandedObstacles(ctx, board.expandedObstacles, transform);
  drawObstacles(ctx, board.obstacles, transform, selectedObstacleIndex);
  drawRoute(ctx, route.points, transform);
  drawPads(ctx, board, transform);
  drawBoardOutline(ctx, board, transform);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.fillStyle = "#101418";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawBoardFill(
  ctx: CanvasRenderingContext2D,
  board: DemoBoard,
  transform: BoardTransform,
) {
  ctx.fillStyle = "#17241d";
  ctx.fillRect(
    transform.offsetX,
    transform.offsetY,
    board.width * transform.scale,
    board.height * transform.scale,
  );
}

function drawBoardOutline(
  ctx: CanvasRenderingContext2D,
  board: DemoBoard,
  transform: BoardTransform,
) {
  ctx.strokeStyle = "#6aa875";
  ctx.lineWidth = 2;

  ctx.strokeRect(
    transform.offsetX,
    transform.offsetY,
    board.width * transform.scale,
    board.height * transform.scale,
  );
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  board: DemoBoard,
  transform: BoardTransform,
  spacing: number,
) {
  ctx.save();

  ctx.strokeStyle = "#26343d";
  ctx.lineWidth = 1;

  for (let x = 0; x <= board.width; x += spacing) {
    const sx = transform.offsetX + x * transform.scale;

    ctx.beginPath();
    ctx.moveTo(sx, transform.offsetY);
    ctx.lineTo(sx, transform.offsetY + board.height * transform.scale);
    ctx.stroke();
  }

  for (let y = 0; y <= board.height; y += spacing) {
    const sy = transform.offsetY + y * transform.scale;

    ctx.beginPath();
    ctx.moveTo(transform.offsetX, sy);
    ctx.lineTo(transform.offsetX + board.width * transform.scale, sy);
    ctx.stroke();
  }

  ctx.restore();
}

function drawExpandedObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Rect[],
  transform: BoardTransform,
) {
  ctx.save();

  ctx.fillStyle = "rgba(227, 107, 122, 0.14)";
  ctx.strokeStyle = "rgba(227, 107, 122, 0.65)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);

  for (const obstacle of obstacles) {
    const rect = rectToCanvas(obstacle, transform);

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Rect[],
  transform: BoardTransform,
  selectedObstacleIndex: number | null,
) {
  ctx.save();

  for (const [index, obstacle] of obstacles.entries()) {
    const rect = rectToCanvas(obstacle, transform);
    const isSelected = index === selectedObstacleIndex;

    ctx.fillStyle = "#5b2530";
    ctx.strokeStyle = isSelected ? "#fff0a8" : "#e36b7a";
    ctx.lineWidth = isSelected ? 4 : 2;

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fill();
    ctx.stroke();

    if (isSelected) {
      drawResizeHandles(ctx, rect);
    }
  }

  ctx.restore();
}

function drawResizeHandles(ctx: CanvasRenderingContext2D, rect: Rect) {
  const corners: Point[] = [
    {
      x: rect.x,
      y: rect.y,
    },
    {
      x: rect.x + rect.width,
      y: rect.y,
    },
    {
      x: rect.x,
      y: rect.y + rect.height,
    },
    {
      x: rect.x + rect.width,
      y: rect.y + rect.height,
    },
  ];

  ctx.save();

  ctx.fillStyle = "#fff0a8";
  ctx.strokeStyle = "#101418";
  ctx.lineWidth = 2;

  for (const corner of corners) {
    ctx.beginPath();
    ctx.rect(
      corner.x - ResizeHandleDrawSize / 2,
      corner.y - ResizeHandleDrawSize / 2,
      ResizeHandleDrawSize,
      ResizeHandleDrawSize,
    );
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawPads(
  ctx: CanvasRenderingContext2D,
  board: DemoBoard,
  transform: BoardTransform,
) {
  ctx.save();

  ctx.font = "13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const pad of board.pads) {
    const center = toCanvas(pad.center, transform);
    const radius = pad.radius * transform.scale;
    const isEditable = pad.id === "P1" || pad.id === "P2";

    ctx.fillStyle = "#c58b2b";
    ctx.strokeStyle = isEditable ? "#fff0a8" : "#ffd27a";
    ctx.lineWidth = isEditable ? 3 : 2;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#101418";
    ctx.fillText(pad.id, center.x, center.y);
  }

  ctx.restore();
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  transform: BoardTransform,
) {
  if (points.length < 2) {
    return;
  }

  ctx.save();

  ctx.strokeStyle = "#55c7ff";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const first = toCanvas(points[0], transform);

  ctx.beginPath();
  ctx.moveTo(first.x, first.y);

  for (const point of points.slice(1)) {
    const p = toCanvas(point, transform);
    ctx.lineTo(p.x, p.y);
  }

  ctx.stroke();

  ctx.fillStyle = "#d9f4ff";

  for (const point of points) {
    const p = toCanvas(point, transform);

    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();
}
