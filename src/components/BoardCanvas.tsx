import { useEffect, useRef } from "react";
import type { DemoBoard, Point, Rect, RouteResult } from "../routing/routeTypes";

type BoardCanvasProps = {
  board: DemoBoard;
  route: RouteResult;
};

type BoardTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export function BoardCanvas({ board, route }: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null) {
      return;
    }

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      const ctx = canvas.getContext("2d");

      if (ctx === null) {
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBoard(ctx, rect.width, rect.height, board, route);
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [board, route]);

  return <canvas ref={canvasRef} className="boardCanvas" />;
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  board: DemoBoard,
  route: RouteResult,
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const transform = getBoardTransform(canvasWidth, canvasHeight, board);

  drawBackground(ctx, canvasWidth, canvasHeight);
  drawBoardFill(ctx, board, transform);
  drawGrid(ctx, board, transform, 10);
  drawExpandedObstacles(ctx, board.expandedObstacles, transform);
  drawObstacles(ctx, board.obstacles, transform);
  drawPads(ctx, board, transform);
  drawRoute(ctx, route.points, transform);
  drawBoardOutline(ctx, board, transform);
}

function getBoardTransform(
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

function toCanvas(point: Point, transform: BoardTransform): Point {
  return {
    x: transform.offsetX + point.x * transform.scale,
    y: transform.offsetY + point.y * transform.scale,
  };
}

function rectToCanvas(rect: Rect, transform: BoardTransform): Rect {
  return {
    x: transform.offsetX + rect.x * transform.scale,
    y: transform.offsetY + rect.y * transform.scale,
    width: rect.width * transform.scale,
    height: rect.height * transform.scale,
  };
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
) {
  ctx.save();

  for (const obstacle of obstacles) {
    const rect = rectToCanvas(obstacle, transform);

    ctx.fillStyle = "#5b2530";
    ctx.strokeStyle = "#e36b7a";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
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

    ctx.fillStyle = "#c58b2b";
    ctx.strokeStyle = "#ffd27a";
    ctx.lineWidth = 2;

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
