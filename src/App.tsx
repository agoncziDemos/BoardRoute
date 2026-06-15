import { useEffect, useRef, useState } from "react";
import { BoardCanvas } from "./components/BoardCanvas";
import { MetricsPanel } from "./components/MetricsPanel";
import { demoBoard, demoRoute } from "./demo/demoBoard";
import {
  routeBoardFromWasm,
  routeDemoBoardFromWasm,
} from "./routing/routerModule";
import type { DemoBoard, Point, Rect, RouteResult } from "./routing/routeTypes";
import "./App.css";

function createRandomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

const NewObstacleSize = 40;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function createObstacleAtCenter(board: DemoBoard, center: Point): Rect {
  return {
    x: clamp(center.x - NewObstacleSize / 2, 0, board.width - NewObstacleSize),
    y: clamp(center.y - NewObstacleSize / 2, 0, board.height - NewObstacleSize),
    width: NewObstacleSize,
    height: NewObstacleSize,
  };
}

function movePad(board: DemoBoard, padId: string, center: Point): DemoBoard {
  return {
    ...board,
    pads: board.pads.map((pad) =>
      pad.id === padId
        ? {
            ...pad,
            center,
          }
        : pad,
    ),
  };
}

function moveObstacle(
  board: DemoBoard,
  obstacleIndex: number,
  obstacle: Rect,
): DemoBoard {
  return {
    ...board,
    obstacles: board.obstacles.map((candidate, index) =>
      index === obstacleIndex ? obstacle : candidate,
    ),
  };
}

function deleteObstacle(board: DemoBoard, obstacleIndex: number): DemoBoard {
  return {
    ...board,
    obstacles: board.obstacles.filter((_, index) => index !== obstacleIndex),
  };
}

function addObstacle(board: DemoBoard, center: Point): DemoBoard {
  return {
    ...board,
    obstacles: [...board.obstacles, createObstacleAtCenter(board, center)],
  };
}

export default function App() {
  const [clearance, setClearance] = useState(25);
  const [boardSeed, setBoardSeed] = useState(createRandomSeed);
  const [board, setBoard] = useState<DemoBoard>(demoBoard);
  const [route, setRoute] = useState<RouteResult>(demoRoute);
  const [status, setStatus] = useState("Ready to route with C++/WASM.");
  const [selectedObstacleIndex, setSelectedObstacleIndex] = useState<
    number | null
  >(null);
  const [isAddingObstacle, setIsAddingObstacle] = useState(false);
  const latestRouteRequest = useRef(0);
  const currentBoardSeed = useRef<number | null>(null);
  const boardRef = useRef<DemoBoard>(demoBoard);

  useEffect(() => {
    const requestId = latestRouteRequest.current + 1;
    latestRouteRequest.current = requestId;

    const shouldRandomize = currentBoardSeed.current !== boardSeed;
    const routePromise = shouldRandomize
      ? routeDemoBoardFromWasm(clearance, boardSeed)
      : routeBoardFromWasm(boardRef.current, clearance);

    setStatus("Routing with C++/WASM...");

    routePromise
      .then((result) => {
        if (latestRouteRequest.current !== requestId) {
          return;
        }

        if (shouldRandomize) {
          currentBoardSeed.current = boardSeed;
        }

        boardRef.current = result.board;
        setBoard(result.board);
        setRoute(result.route);
        setStatus(
          result.route.success
            ? `Seed ${boardSeed}, clearance ${clearance}.`
            : `No path. Seed ${boardSeed}, clearance ${clearance}.`,
        );
      })
      .catch((error: unknown) => {
        if (latestRouteRequest.current !== requestId) {
          return;
        }

        setStatus(
          error instanceof Error ? error.message : "Failed to load C++ route.",
        );
      });
  }, [clearance, boardSeed]);

  const routeEditedBoard = (nextBoard: DemoBoard) => {
    const requestId = latestRouteRequest.current + 1;
    latestRouteRequest.current = requestId;

    boardRef.current = nextBoard;
    setBoard(nextBoard);
    setStatus("Routing with C++/WASM...");

    routeBoardFromWasm(nextBoard, clearance)
      .then((result) => {
        if (latestRouteRequest.current !== requestId) {
          return;
        }

        boardRef.current = result.board;
        setBoard(result.board);
        setRoute(result.route);
        setStatus(
          result.route.success
            ? `Edited board, clearance ${clearance}.`
            : `No path. Edited board, clearance ${clearance}.`,
        );
      })
      .catch((error: unknown) => {
        if (latestRouteRequest.current !== requestId) {
          return;
        }

        setStatus(
          error instanceof Error ? error.message : "Failed to load C++ route.",
        );
      });
  };

  const moveRoutePad = (padId: string, center: Point) => {
    routeEditedBoard(movePad(boardRef.current, padId, center));
  };

  const moveRouteObstacle = (obstacleIndex: number, obstacle: Rect) => {
    routeEditedBoard(moveObstacle(boardRef.current, obstacleIndex, obstacle));
  };

  const deleteSelectedObstacle = () => {
    if (selectedObstacleIndex === null) {
      return;
    }

    setIsAddingObstacle(false);
    setSelectedObstacleIndex(null);
    routeEditedBoard(deleteObstacle(boardRef.current, selectedObstacleIndex));
  };

  const addRouteObstacle = (center: Point) => {
    const nextBoard = addObstacle(boardRef.current, center);

    setIsAddingObstacle(false);
    setSelectedObstacleIndex(nextBoard.obstacles.length - 1);
    routeEditedBoard(nextBoard);
  };

  const toggleAddObstacle = () => {
    const nextIsAdding = !isAddingObstacle;

    setIsAddingObstacle(nextIsAdding);
    setSelectedObstacleIndex(null);
    setStatus(
      nextIsAdding
        ? "Click the board to place a new obstacle."
        : "Ready to route with C++/WASM.",
    );
  };

  const randomizeBoard = () => {
    setIsAddingObstacle(false);
    setSelectedObstacleIndex(null);
    setBoardSeed(createRandomSeed());
  };

  return (
    <main className="app">
      <header className="header">
        <div className="titleRow">
          <h1>Rectangular Obstacle Clearance Router</h1>

          <span
            className="infoButton"
            tabIndex={0}
            aria-label="BoardRoute information"
          >
            i
            <span className="infoTooltip" role="tooltip">
              BoardRoute lets you edit a 2D routing board and see the route
              update live. Drag the start and end points, click an obstacle to
              select it, move or resize it, delete the selected obstacle, or use
              Add Obstacle to place a new one. Adjust clearance or randomize the
              board to see how the C++/WASM A* router expands obstacles and
              finds a path around them.
            </span>
          </span>
        </div>

        <p>
          Move the clearance slider or randomize the rectangular obstacle
          layout. The route updates live and shows when no valid path exists.
        </p>
      </header>

      <section className="controlsPanel">
        <label>
          Clearance: {clearance}
          <input
            type="range"
            min="0"
            max="250"
            step="5"
            value={clearance}
            onChange={(event) => setClearance(Number(event.target.value))}
          />
        </label>

        <button type="button" onClick={randomizeBoard}>
          Randomize board
        </button>

        <button
          type="button"
          className={isAddingObstacle ? "activeButton" : undefined}
          onClick={toggleAddObstacle}
        >
          {isAddingObstacle ? "Cancel add obstacle" : "Add obstacle"}
        </button>

        {selectedObstacleIndex !== null && (
          <button
            type="button"
            className="dangerButton"
            onClick={deleteSelectedObstacle}
          >
            Delete selected obstacle
          </button>
        )}

        <p>{status}</p>
      </section>

      <section className="layout">
        <BoardCanvas
          board={board}
          route={route}
          selectedObstacleIndex={selectedObstacleIndex}
          isAddingObstacle={isAddingObstacle}
          onObstacleSelect={setSelectedObstacleIndex}
          onObstacleAdd={addRouteObstacle}
          onPadMove={moveRoutePad}
          onObstacleMove={moveRouteObstacle}
        />
        <MetricsPanel route={route} />
      </section>
    </main>
  );
}
