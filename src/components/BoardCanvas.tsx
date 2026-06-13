import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { drawBoard } from "./board/boardDrawing";
import {
  clampPointToBoard,
  clampRectToBoard,
  fromCanvas,
  getBoardTransform,
  resizeRectFromHandle,
} from "./board/boardGeometry";
import {
  findEditablePadHit,
  findObstacleHit,
  findResizeHandleHit,
  getResizeCursor,
} from "./board/boardHitTesting";
import type {
  CanvasCursor,
  DragState,
} from "./board/boardInteractionTypes";
import type { DemoBoard, Point, Rect, RouteResult } from "../routing/routeTypes";

type BoardCanvasProps = {
  board: DemoBoard;
  route: RouteResult;
  selectedObstacleIndex: number | null;
  isAddingObstacle: boolean;
  onObstacleSelect: (obstacleIndex: number | null) => void;
  onObstacleAdd?: (center: Point) => void;
  onPadMove?: (padId: string, center: Point) => void;
  onObstacleMove?: (obstacleIndex: number, obstacle: Rect) => void;
};

export function BoardCanvas({
  board,
  route,
  selectedObstacleIndex,
  isAddingObstacle,
  onObstacleSelect,
  onObstacleAdd,
  onPadMove,
  onObstacleMove,
}: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const [cursor, setCursor] = useState<CanvasCursor>("default");

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
      drawBoard(
        ctx,
        rect.width,
        rect.height,
        board,
        route,
        selectedObstacleIndex,
      );
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [board, route, selectedObstacleIndex]);

  const getBoardPoint = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ): Point | null => {
    const canvas = canvasRef.current;

    if (canvas === null) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const canvasPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const transform = getBoardTransform(rect.width, rect.height, board);

    return fromCanvas(canvasPoint, transform);
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (event.button !== 0) {
      return;
    }

    const boardPoint = getBoardPoint(event);

    if (boardPoint === null) {
      return;
    }

    if (isAddingObstacle) {
      onObstacleAdd?.(boardPoint);
      event.preventDefault();

      return;
    }

    const hitResizeHandle = findResizeHandleHit(
      board,
      boardPoint,
      selectedObstacleIndex,
    );

    if (
      hitResizeHandle !== null &&
      selectedObstacleIndex !== null &&
      board.obstacles[selectedObstacleIndex] !== undefined
    ) {
      dragState.current = {
        kind: "resize",
        obstacleIndex: selectedObstacleIndex,
        handle: hitResizeHandle,
        startPoint: boardPoint,
        startRect: board.obstacles[selectedObstacleIndex],
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setCursor(getResizeCursor(hitResizeHandle));
      event.preventDefault();

      return;
    }

    const hitPadId = findEditablePadHit(board, boardPoint);

    if (hitPadId !== null) {
      dragState.current = {
        kind: "pad",
        padId: hitPadId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setCursor("grabbing");
      event.preventDefault();

      return;
    }

    const hitObstacleIndex = findObstacleHit(board, boardPoint);

    if (hitObstacleIndex !== null) {
      onObstacleSelect(hitObstacleIndex);
      dragState.current = {
        kind: "obstacle",
        obstacleIndex: hitObstacleIndex,
        startPoint: boardPoint,
        startRect: board.obstacles[hitObstacleIndex],
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setCursor("grabbing");
      event.preventDefault();

      return;
    }

    onObstacleSelect(null);
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const boardPoint = getBoardPoint(event);

    if (boardPoint === null) {
      return;
    }

    if (isAddingObstacle) {
      setCursor("crosshair");

      return;
    }

    const activeDrag = dragState.current;

    if (activeDrag?.kind === "pad") {
      const pad = board.pads.find((candidate) => {
        return candidate.id === activeDrag.padId;
      });

      if (pad === undefined) {
        return;
      }

      onPadMove?.(
        activeDrag.padId,
        clampPointToBoard(boardPoint, board, pad.radius),
      );
      event.preventDefault();

      return;
    }

    if (activeDrag?.kind === "obstacle") {
      const delta = {
        x: boardPoint.x - activeDrag.startPoint.x,
        y: boardPoint.y - activeDrag.startPoint.y,
      };
      const nextRect = clampRectToBoard(
        {
          ...activeDrag.startRect,
          x: activeDrag.startRect.x + delta.x,
          y: activeDrag.startRect.y + delta.y,
        },
        board,
      );

      onObstacleMove?.(activeDrag.obstacleIndex, nextRect);
      event.preventDefault();

      return;
    }

    if (activeDrag?.kind === "resize") {
      const delta = {
        x: boardPoint.x - activeDrag.startPoint.x,
        y: boardPoint.y - activeDrag.startPoint.y,
      };
      const nextRect = resizeRectFromHandle(
        activeDrag.startRect,
        activeDrag.handle,
        delta,
        board,
      );

      onObstacleMove?.(activeDrag.obstacleIndex, nextRect);
      event.preventDefault();

      return;
    }

    const hitResizeHandle = findResizeHandleHit(
      board,
      boardPoint,
      selectedObstacleIndex,
    );

    if (hitResizeHandle !== null) {
      setCursor(getResizeCursor(hitResizeHandle));

      return;
    }

    if (findEditablePadHit(board, boardPoint) !== null) {
      setCursor("pointer");

      return;
    }

    setCursor(findObstacleHit(board, boardPoint) === null ? "default" : "grab");
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragState.current === null) {
      return;
    }

    dragState.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setCursor("default");
    event.preventDefault();
  };

  return (
    <canvas
      ref={canvasRef}
      className="boardCanvas"
      style={{ cursor: isAddingObstacle ? "crosshair" : cursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
