import createRouterModule from "../wasm/dist/router.js";
import routerWasmUrl from "../wasm/dist/router.wasm?url";
import { demoBoard } from "../demo/demoBoard";
import type {
  DemoBoard,
  Net,
  Pad,
  Point,
  Rect,
  RouteMetrics,
  RouteResult,
} from "./routeTypes";

type WasmRouteDemoResult = {
  padCount: number;
  routePointCount: number;
  obstacleCount: number;
  expandedObstacleCount: number;
  metricCount: number;
  pads: Float32Array;
  routePoints: Float32Array;
  obstacles: Float32Array;
  expandedObstacles: Float32Array;
  metrics: Float32Array;
};

type BoardRouteResult = {
  board: DemoBoard;
  route: RouteResult;
};

let routerModulePromise: ReturnType<typeof createRouterModule> | null = null;

export async function routeBoardFromWasm(
  board: DemoBoard,
  clearance: number,
): Promise<BoardRouteResult> {
  const module = await getRouterModule();
  const result = module.routeBoard(
    packPads(board.pads),
    packRects(board.obstacles),
    clearance,
  );

  return toBoardRouteResult(result, board);
}

export async function routeDemoBoardFromWasm(
  clearance: number,
  seed: number,
): Promise<BoardRouteResult> {
  const module = await getRouterModule();
  const result = module.computeDemoRoute(clearance, seed);

  return toBoardRouteResult(result, demoBoard);
}

function getRouterModule(): ReturnType<typeof createRouterModule> {
  routerModulePromise ??= createRouterModule({
    locateFile: (path: string, _prefix: string): string => {
      if (path.endsWith(".wasm")) {
        return routerWasmUrl;
      }

      return new URL(`../wasm/dist/${path}`, import.meta.url).href;
    },
  });

  return routerModulePromise;
}

function toBoardRouteResult(
  result: WasmRouteDemoResult,
  fallbackBoard: DemoBoard,
): BoardRouteResult {
  const pads = readPads(result.pads);
  const metricReadResult = readMetrics(result.metrics);

  return {
    board: {
      ...fallbackBoard,
      pads,
      nets: createNets(pads),
      obstacles: readRects(result.obstacles),
      expandedObstacles: readRects(result.expandedObstacles),
    },
    route: {
      success: metricReadResult.success,
      netId: "N1",
      points: readPoints(result.routePoints),
      metrics: metricReadResult.metrics,
    },
  };
}

function packPads(pads: Pad[]): Float32Array {
  const values = new Float32Array(pads.length * 4);

  pads.forEach((pad, index) => {
    const offset = index * 4;
    const netIndex = pad.netId === "N1"
      ? 1
      : Number.parseInt(pad.netId.replace("N", ""), 10) || index + 1;

    values[offset] = pad.center.x;
    values[offset + 1] = pad.center.y;
    values[offset + 2] = pad.radius;
    values[offset + 3] = netIndex;
  });

  return values;
}

function packRects(rects: Rect[]): Float32Array {
  const values = new Float32Array(rects.length * 4);

  rects.forEach((rect, index) => {
    const offset = index * 4;

    values[offset] = rect.x;
    values[offset + 1] = rect.y;
    values[offset + 2] = rect.width;
    values[offset + 3] = rect.height;
  });

  return values;
}

function readPads(values: WasmRouteDemoResult["pads"]): Pad[] {
  const pads: Pad[] = [];

  for (let i = 0; i + 3 < values.length; i += 4) {
    const padIndex = i / 4;
    const netIndex = Math.trunc(values[i + 3]);
    const id = `P${padIndex + 1}`;
    const netId = netIndex === 1 ? "N1" : `N${netIndex}`;

    pads.push({
      id,
      center: {
        x: values[i],
        y: values[i + 1],
      },
      radius: values[i + 2],
      netId,
    });
  }

  return pads;
}

function createNets(pads: Pad[]): Net[] {
  const nets: Net[] = [];

  nets.push({
    id: "N1",
    padIds: pads
      .filter((pad) => pad.netId === "N1")
      .map((pad) => pad.id),
  });

  for (const pad of pads) {
    if (pad.netId === "N1") {
      continue;
    }

    nets.push({
      id: pad.netId,
      padIds: [pad.id],
    });
  }

  return nets;
}

function readPoints(values: WasmRouteDemoResult["routePoints"]): Point[] {
  const points: Point[] = [];

  for (let i = 0; i + 1 < values.length; i += 2) {
    points.push({
      x: values[i],
      y: values[i + 1],
    });
  }

  return points;
}

function readRects(values: WasmRouteDemoResult["obstacles"]): Rect[] {
  const rects: Rect[] = [];

  for (let i = 0; i + 3 < values.length; i += 4) {
    rects.push({
      x: values[i],
      y: values[i + 1],
      width: values[i + 2],
      height: values[i + 3],
    });
  }

  return rects;
}

function readMetrics(values: WasmRouteDemoResult["metrics"]): {
  success: boolean;
  metrics: RouteMetrics;
} {
  return {
    success: (values[0] ?? 0) > 0,
    metrics: {
      length: values[2] ?? 0,
      bends: values[3] ?? 0,
      vias: values[4] ?? 0,
      violations: values[5] ?? 0,
      runtimeMs: values[6] ?? 0,
    },
  };
}
