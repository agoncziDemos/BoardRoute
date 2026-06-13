import { useEffect, useRef, useState } from "react";
import { BoardCanvas } from "./components/BoardCanvas";
import { MetricsPanel } from "./components/MetricsPanel";
import { demoBoard, demoRoute } from "./demo/demoBoard";
import { routeDemoBoardFromWasm } from "./routing/routerModule";
import type { DemoBoard, RouteResult } from "./routing/routeTypes";
import "./App.css";

function createRandomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

export default function App() {
  const [clearance, setClearance] = useState(25);
  const [boardSeed, setBoardSeed] = useState(createRandomSeed);
  const [board, setBoard] = useState<DemoBoard>(demoBoard);
  const [route, setRoute] = useState<RouteResult>(demoRoute);
  const [status, setStatus] = useState("Ready to route with C++/WASM.");
  const latestRouteRequest = useRef(0);

  useEffect(() => {
    const requestId = latestRouteRequest.current + 1;
    latestRouteRequest.current = requestId;

    setStatus("Routing with C++/WASM...");

    routeDemoBoardFromWasm(clearance, boardSeed)
      .then((result) => {
        if (latestRouteRequest.current !== requestId) {
          return;
        }

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

  const randomizeBoard = () => {
    setBoardSeed(createRandomSeed());
  };

  return (
    <main className="app">
      <header className="header">
        <h1>Rectangular Obstacle Clearance Router</h1>
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

        <p>{status}</p>
      </section>

      <section className="layout">
        <BoardCanvas board={board} route={route} />
        <MetricsPanel route={route} />
      </section>
    </main>
  );
}
