import createRouterModule from "../wasm/dist/router.js";
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

let routerModulePromise: ReturnType<typeof createRouterModule> | null = null;

export async function routeDemoBoardFromWasm(
  clearance: number,
  seed: number,
): Promise<{
  board: DemoBoard;
  route: RouteResult;
}> {
  const module = await getRouterModule();
  const result = module.computeDemoRoute(clearance, seed);
  const pads = readPads(result.pads);
  const metricReadResult = readMetrics(result.metrics);

  return {
    board: {
      ...demoBoard,
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

function getRouterModule(): ReturnType<typeof createRouterModule> {
  routerModulePromise ??= createRouterModule({
    locateFile: (path: string, _prefix: string): string => {
      return new URL(`../wasm/dist/${path}`, import.meta.url).href;
    },
  });

  return routerModulePromise;
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
